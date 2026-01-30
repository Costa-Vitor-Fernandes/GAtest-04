const { execSync } = require('child_process');
const fs = require('fs');

// Config do teu exemplo
const BASE_TAG = process.env.BASE_TAG || '4a112c754abba0bb893ae3d22c1b5e825c1e1584';
const BASE_VERSION = process.env.BASE_VERSION || '0.0.1';
const PR_TITLE = process.env.PR_TITLE;

// Pega commits desde a tag base
const commits = execSync(`git log --oneline --format="%s" ${BASE_TAG}..HEAD 2>/dev/null || echo ""`)
  .toString().trim().split('\n').filter(Boolean);

// Adiciona título do PR (que vira commit no merge)
commits.unshift(PR_TITLE);

let bump = 'patch';
const counts = { breaking: 0, feat: 0, fix: 0, other: 0, invalid: 0 };

commits.forEach(msg => {
  const m = msg.match(/^(\w+)(?:\(.*\))?(!?):\s(.+)/);
  if (!m) {
    counts.invalid++;
    console.error(`❌ Inválido: ${msg}`);
    return;
  }
  
  const [_, type, bang] = m;
  
  if (bang === '!' || msg.includes('BREAKING CHANGE')) {
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

// Falha se tiver commit inválido
if (counts.invalid > 0) {
  console.error(`\n❌ ${counts.invalid} commit(s) fora do padrão!`);
  console.error('Padrão: tipo(escopo?): descrição');
  console.error('Ex: feat: nova func ou fix(api): corrige bug');
  process.exit(1);
}

// Calcula versão
const [major, minor, patch] = BASE_VERSION.split('.').map(Number);
const next = bump === 'major' ? `v${major + 1}.0.0` :
             bump === 'minor' ? `v${major}.${minor + 1}.0` :
                                 `v${major}.${minor}.${patch + 1}`;

// Outputs
fs.appendFileSync(process.env.GITHUB_OUTPUT, `next=${next}\n`);
fs.appendFileSync(process.env.GITHUB_OUTPUT, `last=v${BASE_VERSION}\n`);
fs.appendFileSync(process.env.GITHUB_OUTPUT, `analysis=✅ **Análise:**\\n- ⚠️ Breaking: ${counts.breaking}\\n- ✨ Feat: ${counts.feat}\\n- 🐛 Fix: ${counts.fix}\\n- 📝 Outros: ${counts.other}\n`);

console.log(`✅ ${next} (${bump} bump)`);