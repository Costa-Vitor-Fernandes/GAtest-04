const conventionalRecommendedBump = require('conventional-recommended-bump');
const semver = require('semver');
const { execSync } = require('child_process');
const fs = require('fs');

async function calculateVersion() {
  try {
    // 1. Garante que temos as tags para comparar
    // No CI, muitas vezes as tags não são baixadas automaticamente
    execSync('git fetch --tags --force');

    let currentVersion = '0.0.0';
    try {
      // Busca a tag mais recente que siga o padrão v1.2.3
      const latestTag = execSync('git describe --tags --abbrev=0 2>/dev/null')
        .toString()
        .trim()
        .replace(/^v/, '');
      
      currentVersion = semver.valid(latestTag) || '0.0.0';
    } catch (e) {
      console.log('ℹ️ Nenhuma tag encontrada ou erro no git describe. Iniciando do 0.0.0');
    }

    console.log(`📡 Versão atual detectada: ${currentVersion}`);

    // 2. Determina o bump (Isso é assíncrono!)
    const result = await conventionalRecommendedBump({
      preset: 'conventionalcommits',
      tagPrefix: 'v'
    });

    // Se não houver commits relevantes, o releaseType pode vir undefined
    let releaseType = result.releaseType || 'patch'; 
    console.log(`Recommendation: ${releaseType}`);

    // 3. Calcula a nova versão
    const newVersion = semver.inc(currentVersion, releaseType);
    
    // 4. Detecta Breaking Changes para o output informativo
    // Ajustado para olhar do HEAD até a última tag (ou todo o histórico)
    const logRange = currentVersion === '0.0.0' ? 'HEAD' : `v${currentVersion}..HEAD`;
    const commits = execSync(`git log ${logRange} --format=%B`).toString();
    const hasBreakingChange = commits.includes('BREAKING CHANGE:') || /^[a-z]+(\(.+\))?!:/.test(commits);

    console.log(`✨ Nova versão: ${newVersion}`);
    console.log(`⚠️ Breaking changes: ${hasBreakingChange}`);
    
    // 5. Output para o GitHub Actions
    if (process.env.GITHUB_OUTPUT) {
      const output = `current=${currentVersion}\nnext=${newVersion}\nrelease_type=${releaseType}\nbreaking=${hasBreakingChange}\n`;
      fs.appendFileSync(process.env.GITHUB_OUTPUT, output);
      console.log("✅ Outputs gravados no GITHUB_OUTPUT");
    }

    return { currentVersion, newVersion, releaseType, hasBreakingChange };
  } catch (error) {
    console.error('❌ Erro crítico ao calcular versão:', error.message);
    process.exit(1);
  }
}

calculateVersion();