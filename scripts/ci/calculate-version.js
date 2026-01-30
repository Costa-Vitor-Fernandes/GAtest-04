const { execSync } = require('child_process');
const fs = require('fs');

// Configurações
const DEFAULT_VERSION = '0.0.1';
const PR_TITLE = process.env.PR_TITLE;
const BASE_REF = process.env.BASE_REF || 'main';
const HEAD_REF = process.env.HEAD_REF;

function setOutput(name, value) {
  console.log(`Setting output ${name}: ${value}`);
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
}

function getLatestSemVerTag() {
  try {
    // Busca tags SemVer ordenadas por versão
    const tags = execSync(
      'git tag -l "v[0-9]*.[0-9]*.[0-9]*" --sort=-v:refname | head -1'
    ).toString().trim();
    
    return tags || `v${DEFAULT_VERSION}`;
  } catch (error) {
    console.log(`Erro ao buscar tags: ${error.message}`);
    return `v${DEFAULT_VERSION}`;
  }
}

function getCommitsInPR() {
  try {
    // Pega commits que estão no PR mas não na base
    const commits = execSync(
      `git log --oneline --format="%s" origin/${BASE_REF}..HEAD 2>/dev/null || echo ""`
    ).toString().trim();
    
    return commits ? commits.split('\n') : [];
  } catch (error) {
    console.log(`Erro ao buscar commits do PR: ${error.message}`);
    return [];
  }
}

function analyzeCommitMessage(message) {
  const types = [
    'feat', 'fix', 'chore', 'docs', 'style', 
    'refactor', 'perf', 'test', 'build', 'ci', 'revert'
  ];
  
  // Padrão: tipo(escopo): descrição
  const pattern = new RegExp(`^(${types.join('|')})(?:\\(.*\\))?!?:\\s.+`, 'i');
  
  if (!pattern.test(message)) {
    return { valid: false, type: null, breaking: false };
  }
  
  const type = message.split(':')[0].toLowerCase();
  const breaking = message.includes('!:'); // Breaking change explícito
  const isBreakingChange = breaking || message.includes('BREAKING CHANGE:');
  
  return {
    valid: true,
    type: type.replace('!', '').replace(/\(.*\)/, ''),
    breaking: isBreakingChange,
    isFeat: type.startsWith('feat')
  };
}

function determineBumpType(commits) {
  let bump = 'patch';
  const analysis = {
    breaking: 0,
    features: 0,
    fixes: 0,
    other: 0,
    invalid: 0
  };
  
  for (const commit of commits) {
    const result = analyzeCommitMessage(commit);
    
    if (!result.valid) {
      analysis.invalid++;
      continue;
    }
    
    if (result.breaking) {
      analysis.breaking++;
      bump = 'major';
    } else if (result.isFeat && bump !== 'major') {
      analysis.features++;
      bump = 'minor';
    } else if (result.type === 'fix' && bump === 'patch') {
      analysis.fixes++;
      // Já é patch, mantém
    } else {
      analysis.other++;
    }
  }
  
  return { bump, analysis };
}

function calculateNextVersion(lastTag, bumpType) {
  const version = lastTag.replace('v', '');
  const [major, minor, patch] = version.split('.').map(Number);
  
  switch (bumpType) {
    case 'major':
      return `v${major + 1}.0.0`;
    case 'minor':
      return `v${major}.${minor + 1}.0`;
    case 'patch':
      return `v${major}.${minor}.${patch + 1}`;
    default:
      return lastTag;
  }
}

function main() {
  try {
    // 1. Buscar última tag
    const lastTag = getLatestSemVerTag();
    console.log(`Última tag: ${lastTag}`);
    
    // 2. Buscar commits do PR
    const prCommits = getCommitsInPR();
    console.log(`Commits no PR: ${prCommits.length}`);
    
    // 3. Incluir título do PR (que será o commit de merge)
    const allCommits = [PR_TITLE, ...prCommits];
    console.log('Analisando commits:', allCommits);
    
    // 4. Determinar tipo de bump
    const { bump, analysis } = determineBumpType(allCommits);
    console.log(`Tipo de bump: ${bump}`);
    console.log('Análise:', analysis);
    
    // 5. Verificar commits inválidos
    if (analysis.invalid > 0) {
      console.error(`❌ Encontrados ${analysis.invalid} commit(s) inválido(s)`);
      console.error('Certifique-se que todos os commits seguem o padrão:');
      console.error('  feat: adiciona nova funcionalidade');
      console.error('  fix: corrige um bug');
      console.error('  docs: documentação');
      console.error('  etc...');
      process.exit(1);
    }
    
    // 6. Calcular próxima versão
    const nextVersion = calculateNextVersion(lastTag, bump);
    
    // 7. Gerar análise formatada
    const analysisText = `
    - ⚠️  **Breaking Changes:** ${analysis.breaking}
    - ✨  **Features:** ${analysis.features}
    - 🐛  **Fixes:** ${analysis.fixes}
    - 📝  **Outros:** ${analysis.other}
    `;
    
    // 8. Setar outputs
    setOutput('next_version', nextVersion);
    setOutput('last_version', lastTag.replace('v', ''));
    setOutput('bump_type', bump);
    setOutput('analysis', analysisText);
    
    console.log(`✅ Próxima versão: ${nextVersion}`);
    
  } catch (error) {
    console.error(`❌ Erro: ${error.message}`);
    process.exit(1);
  }
}

main();