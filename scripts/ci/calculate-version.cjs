const { execSync } = require('child_process');
const fs = require('fs');
const semver = require('semver');
const conventionalRecommendedBump = require('conventional-recommended-bump');

function git(command) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
  } catch (e) {
    return null;
  }
}

async function run() {
  console.log("🛠️  Iniciando Processo de Versionamento...");

  try {
    // 1. Garantir que o ambiente tem as tags (O GitHub Actions faz clone raso por padrão)
    git('git fetch --tags --force');

    // 2. Tentar obter a última tag
    const rawTag = git('git describe --tags --abbrev=0');
    let currentVersion = '0.0.0';

    if (rawTag) {
      // semver.clean remove o 'v' e espaços: 'v1.0.0' -> '1.0.0'
      currentVersion = semver.clean(rawTag) || semver.coerce(rawTag).version || '0.0.0';
    }
    console.log(`📌 Versão Atual: ${currentVersion}`);

    // 3. Calcular o próximo "bump" (salto) baseado nos commits
    const recommendation = await conventionalRecommendedBump({
      preset: 'conventionalcommits',
      tagPrefix: 'v'
    });

    const releaseType = recommendation.releaseType || 'patch';
    const nextVersion = semver.inc(currentVersion, releaseType);
    console.log(`📈 Tipo de Release: ${releaseType.toUpperCase()}`);
    console.log(`✨ Próxima Versão: ${nextVersion}`);

    // 4. Verificar Breaking Changes para o log informativo
    // Se não houver tag anterior, olhamos todo o histórico (HEAD)
    const range = rawTag ? `${rawTag}..HEAD` : 'HEAD';
    const commitHistory = git(`git log ${range} --format=%B --`) || "";
    
    // Regex para detectar padrão 'feat!:' ou o texto 'BREAKING CHANGE:'
    const hasBreaking = commitHistory.includes('BREAKING CHANGE:') || /^[a-z]+(\(.+\))?!:/m.test(commitHistory);

    // 5. Exportar para o GitHub Actions
    if (process.env.GITHUB_OUTPUT) {
      const output = [
        `current=${currentVersion}`,
        `next=${nextVersion}`,
        `release_type=${releaseType}`,
        `breaking=${hasBreaking}`
      ].join('\n');
      
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `${output}\n`);
      console.log("✅ Dados salvos no GITHUB_OUTPUT.");
    }

    console.log("\n🚀 Processo concluído com sucesso!");

  } catch (error) {
    console.error("\n❌ Erro ao processar versão:");
    console.error(error.message);
    process.exit(1);
  }
}

run();