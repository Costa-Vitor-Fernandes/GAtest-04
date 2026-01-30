const { execSync } = require('child_process');

function runCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
  } catch (error) {
    return null;
  }
}

function validateCommits() {
//  console.log("🚀 Iniciando validação de mensagens de commit...\n");

  // 1. Definição da Base de Comparação
  let baseRef = process.env.GITHUB_BASE_REF;
  
  if (!baseRef) {
    console.log("⚠️  GITHUB_BASE_REF não detectada. Validando contra o commit anterior (HEAD~1).");
    baseRef = "HEAD~1";
  } else {
    baseRef = `origin/${baseRef}`;
    // Fetch para garantir que temos o histórico necessário
    runCommand(`git fetch origin ${process.env.GITHUB_BASE_REF} --depth=100`);
  }

  // 2. Coleta de Commits
  const commitsRaw = runCommand(`git log --format=%H ${baseRef}..HEAD`);
  
  if (!commitsRaw) {
   // console.log("✅ Nenhum commit novo para validar.");
    process.exit(0);
  }

  const commits = commitsRaw.split('\n').filter(h => h.length > 0);
  let hasError = false;

  // 3. Loop de Validação
  commits.forEach((hash) => {
    const shortHash = hash.substring(0, 7);
    const commitMsg = runCommand(`git log -1 --format=%B ${hash}`);
    
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`🔍 Validando commit ${shortHash}:`);
    console.log(`"${commitMsg.split('\n')[0]}"`); // Mostra apenas a primeira linha

    try {
      // O segredo aqui é passar a mensagem via 'input' e usar 'pipe' para o stdio
      // para que o erro do commitlint não mate o script imediatamente, mas nos permita capturar o status
      execSync(`npx commitlint --verbose --config scripts/ci/commitlint.config.js`, { 
        input: commitMsg, 
        stdio: ['pipe', 'inherit', 'inherit'], // Pega o input do código, mas mostra saída no console
        encoding: 'utf8' 
      });
      console.log("\n✅ Commit válido!");
    } catch (e) {
      hasError = true;
      console.log(`\n❌ Commit ${shortHash} está INVÁLIDO!`);
      console.log("\n⚠️  DICA: Verifique se há espaço após os dois pontos (ex: feat: add algo)");
    }
    console.log(""); 
  });

  // 4. Finalização
  if (hasError) {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("❌ Validação falhou. Por favor, corrija as mensagens acima.");
    console.log("Use: git rebase -i HEAD~N (marcando como 'reword')");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    process.exit(1);
  }

  console.log("🎉 Todos os commits estão dentro do padrão!");
}

validateCommits();