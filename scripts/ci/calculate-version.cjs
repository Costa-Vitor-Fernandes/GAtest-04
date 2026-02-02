const { execSync } = require('child_process');
const fs = require('fs');
const semver = require('semver');

function git(command) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
  } catch (e) {
    return null;
  }
}

function github_output (currentVersion, nextVersion, releaseType){
  const output = [
        `current=${currentVersion}`,
        `next=${nextVersion}`,
        `release_type=${releaseType}`,
        `breaking=${releaseType === 'major'}`
      ].join('\n');
      
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `${output}\n`);
      return
}

async function run() {
  try {
    // 1. Sincronização de Tags
    git('git fetch --tags --force');

    // 2. Obter Versão Atual
    const rawTag = git('git describe --tags --abbrev=0');
    let currentVersion = '0.0.0';
    if (rawTag) {
      currentVersion = semver.clean(rawTag) || semver.coerce(rawTag).version || '0.0.0';
    }
    console.log(`📌 Versão Atual: ${currentVersion}`);
    // 3. Isolar Commits do PR (ignorando o commit de Merge)
    // O range origin/base-ref..HEAD pega o que é novo nesta branch
    const baseBranch = process.env.GITHUB_BASE_REF || 'main';
    // --no-merges é a chave aqui! Ignora o "Merge pull request..."
    const prCommits = git(`git log origin/${baseBranch}..HEAD --format=%B --no-merges`) || "";
    
    console.log("📝 Analisando mensagens de commit do PR...");
    // 4. Lógica de Decisão 
    let releaseType = null;

// 1. Verificação de MAJOR (Breaking Changes)
    if (prCommits.includes('BREAKING CHANGE:') || /^[a-z]+(\(.+\))?!:/m.test(prCommits)) {
      releaseType = 'major';
    } 
    // 2. Verificação de MINOR (Novas funcionalidades)
    else if (/^feat(\(.+\))?:/m.test(prCommits)) {
      releaseType = 'minor';
    } 
    // 3. Verificação de PATCH (Correções e melhorias internas)
    // Aqui incluímos apenas o que deve gerar versão. Docs, chore, style, etc., ficam de fora.
    else if (/^(fix|perf|refactor)(\(.+\))?:/m.test(prCommits)) {
      releaseType = 'patch';
    }

    // 4.1 Validação de Bump: Se não for nenhum dos acima, releaseType continua null
    else if (!releaseType) {
      console.log("ℹ️ Commits detectados não exigem nova versão (ex: docs, chore, style, test).");
      const nextVersion = null
      // 5. Exportar Outputs se NÃO HÁ bump                  
      if (process.env.GITHUB_OUTPUT) return github_output(currentVersion,currentVersion,releaseType)
    }

    const nextVersion = semver.inc(currentVersion, releaseType);
    console.log(`📈 Decisão: ${releaseType}`);
    console.log(`✨ Próxima Versão: ${nextVersion}`);

    // 5. Exportar Outputs se há bump
    if (process.env.GITHUB_OUTPUT) return github_output(currentVersion,nextVersion,releaseType)    

  } catch (error) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  }
}
run();