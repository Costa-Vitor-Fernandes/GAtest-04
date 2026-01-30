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

async function run() {
  console.log("🛠️  Iniciando Processo de Versionamento Estrito...");

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
    // O range origin/main..HEAD pega o que é novo nesta branch
    const baseBranch = process.env.GITHUB_BASE_REF || 'main';
    
    // --no-merges é a chave aqui! Ignora o "Merge pull request..."
    const prCommits = git(`git log origin/${baseBranch}..HEAD --format=%B --no-merges`) || "";
    
    console.log("📝 Analisando mensagens de commit do PR...");

    // 4. Lógica de Decisão Manual (Mais segura que bibliotecas externas neste caso)
    let releaseType = 'patch'; // Padrão

    if (prCommits.includes('BREAKING CHANGE:') || /^[a-z]+(\(.+\))?!:/m.test(prCommits)) {
      releaseType = 'major';
    } else if (/^feat(\(.+\))?:/m.test(prCommits)) {
      releaseType = 'minor';
    } else if (/^fix(\(.+\))?:/m.test(prCommits)) {
      releaseType = 'patch';
    } else {
      console.log("ℹ️ Nenhum prefixo convencional (feat/fix) encontrado. Mantendo PATCH.");
      releaseType = 'patch';
    }

    const nextVersion = semver.inc(currentVersion, releaseType);
    
    console.log(`📈 Decisão: ${releaseType.toUpperCase()}`);
    console.log(`✨ Próxima Versão: ${nextVersion}`);

    // 5. Exportar Outputs
    if (process.env.GITHUB_OUTPUT) {
      const output = [
        `current=${currentVersion}`,
        `next=${nextVersion}`,
        `release_type=${releaseType}`,
        `breaking=${releaseType === 'major'}`
      ].join('\n');
      
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `${output}\n`);
    }

  } catch (error) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  }
}

run();