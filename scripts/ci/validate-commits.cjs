const { execSync } = require('child_process');

/**
 * Executa um comando no terminal e retorna a saída como string
 */
function runCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8' }).trim();
  } catch (error) {
    console.error(`Erro ao executar comando: ${command}`);
    return null;
  }
}

function validateCommits() {
  // 1. Obtemos a branch de destino (base) via variável de ambiente do GitHub ou default 'main'
  const baseRef = process.env.GITHUB_BASE_REF || 'main';
  
  console.log(`🔍 Validando commits contra a branch: ${baseRef}\n`);

  // 2. Fazemos o fetch para garantir que temos os dados da branch base
  runCommand(`git fetch origin ${baseRef}`);

  // 3. Listamos os hashes dos commits do PR
  const commitsRaw = runCommand(`git log --format=%H origin/${baseRef}..HEAD`);
  
  if (!commitsRaw) {
    console.log("✅ Nenhum commit novo para validar.");
    process.exit(0);
  }

  const commits = commitsRaw.split('\n');
  let hasError = false;

  commits.forEach((hash) => {
    const commitMsg = runCommand(`git log -1 --format=%B ${hash}`);
    const shortHash = hash.substring(0, 7);

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Validando commit ${shortHash}:`);
    console.log(`"${commitMsg.split('\n')[0]}"`); // Mostra apenas a primeira linha

    try {
      // 4. Executa o commitlint via npx
      // O echo passa a mensagem para o stdin do commitlint
      execSync(`echo "${commitMsg}" | npx commitlint --verbose`, { stdio: 'inherit' });
      console.log("✅ Commit válido!\n");
    } catch (error) {
      console.log(`\n❌ Commit ${shortHash} está INVÁLIDO!`);
      console.log("⚠️  DICA: Certifica-te que usas o padrão 'tipo: mensagem' (ex: feat: add login)");
      hasError = true;
    }
  });

  // 5. Finalização
  if (hasError) {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("❌ Um ou mais commits estão fora do padrão!");
    console.log("💡 Corrija-os usando: git rebase -i HEAD~N e force push.");
    process.exit(1);
  } else {
    console.log("✅ Todos os commits passaram na validação!");
    process.exit(0);
  }
}

validateCommits();