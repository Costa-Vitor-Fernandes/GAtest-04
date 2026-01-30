const { execSync } = require('child_process');

function runCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
  } catch (error) {
    return null;
  }
}

function validateCommits() {
  // 1. Tenta pegar a base do PR, se falhar tenta 'main', se falhar tenta 'master'
  let baseRef = process.env.GITHUB_BASE_REF;
  
  if (!baseRef || baseRef === 'undefined' || baseRef === '') {
    // Se não for PR, comparamos com o commit anterior para não quebrar
    console.log("⚠️  GITHUB_BASE_REF não detectada. Validando apenas o último commit.");
    baseRef = 'HEAD~1';
  } else {
    baseRef = `origin/${baseRef}`;
    // Garante que a branch base existe localmente para comparação
    runCommand(`git fetch origin ${process.env.GITHUB_BASE_REF} --depth=100`);
  }

  console.log(`🔍 Alvo da validação: ${baseRef}\n`);

  // 2. Obtém os hashes
  const command = `git log --format=%H ${baseRef}..HEAD`;
  const commitsRaw = runCommand(command);
  
  if (!commitsRaw) {
    console.log("✅ Nenhum commit novo para validar ou branch base não encontrada.");
    process.exit(0);
  }

  const commits = commitsRaw.split('\n').filter(h => h.length > 0);
  let hasError = false;

  // ... (resto da lógica de loop igual ao anterior)
  commits.forEach((hash) => {
    const commitMsg = runCommand(`git log -1 --format=%B ${hash}`);
    if (!commitMsg) return;

    console.log(`Validando: ${hash.substring(0, 7)}`);
    try {
      // Usamos npx commitlint diretamente
      execSync(`npx commitlint --input-stdin`, { input: commitMsg, stdio: 'inherit' });
    } catch (e) {
      hasError = true;
    }
  });

  if (hasError) process.exit(1);
}

validateCommits();