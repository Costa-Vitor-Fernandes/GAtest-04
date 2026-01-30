const { execSync } = require('child_process');
const fs = require('fs');

// Config do SEU projeto
const PR_TITLE = process.env.PR_TITLE;
const PR_BASE = process.env.PR_BASE;
const PR_HEAD = process.env.PR_HEAD;
const BASE_TAG = process.env.BASE_TAG || 'v0.0.1';

// Pega última tag REAL (se não achar, usa BASE_TAG)
const lastTag = execSync(`git describe --tags --abbrev=0 2>/dev/null || echo "${BASE_TAG}"`).toString().trim();

// Pega commits do PR (base..head)
const prCommits = execSync(`git log --oneline --format="%s" ${PR_BASE}..${PR_HEAD} 2>/dev/null || echo ""`)
  .toString().trim().split('\n').filter(Boolean);

// Inclui título do PR (que vira commit no merge)
const allCommits = [PR_TITLE, ...prCommits];

let bump = 'patch';
const counts = { breaking: 0, feat: 0, fix: 0, other: 0 };
let invalidCommits = [];

allCommits.forEach(msg => {
  // Padrão: tipo(escopo)?!?: descrição
  const match = msg.match(/^(\w+)(?:\([^)]+\))?(!?):\s(.+)/);
  
  if (!match) {
    invalidCommits.push(`"${msg}"`);
    return;
  }
  
  const type = match[1];
  const breaking = match[2] === '!' || msg.includes('BREAKING CHANGE');
  
  if (breaking) {
    counts.breaking++;
    bump = 'major';
  } else if (type === 'feat' && bump !== 'major') {
    counts.feat++;
    bump = 'minor';
  } else if (type === 'fix') {
    counts.fix++;
  } else {
    counts.other++;
  }
});

// FALHA se tiver commits inválidos
if (invalidCommits.length > 0) {
  console.error('❌ Commits inválidos encontrados:');
  invalidCommits.forEach(c => console.error(`  - ${c}`));
  console.error('\n✅ Padrão exigido: tipo(escopo?): descrição');
  console.error('   Ex: feat: adiciona login');
  console.error('       fix(api): corrige bug');
  console.error('       feat!: breaking change');
  process.exit(1);
}

// Pega versão da última tag
const lastVersion = lastTag.replace('v', '');
const [major, minor, patch] = lastVersion.split('.').map(Number);

// Calcula próxima versão
const next = bump === 'major' ? `v${major + 1}.0.0` :
             bump === 'minor' ? `v${major}.${minor + 1}.0` :
                                `v${major}.${minor}.${patch + 1}`;

// Outputs
fs.appendFileSync(process.env.GITHUB_OUTPUT, `next_version=${next}\n`);
fs.appendFileSync(process.env.GITHUB_OUTPUT, `last_tag=${lastTag}\n`);
fs.appendFileSync(process.env.GITHUB_OUTPUT, `analysis=✅ **Análise:**\\n- ⚠️ Breaking: ${counts.breaking}\\n- ✨ Feat: ${counts.feat}\\n- 🐛 Fix: ${counts.fix}\\n- 📝 Outros: ${counts.other}\n`);

console.log(`✅ ${next} (${bump} bump desde ${lastTag})`);