module.exports = ({ core }) => {
  const fs = require('fs');
  
  // 1. Ler o sumário gerado anteriormente
  const summary = fs.readFileSync('version-summary.txt', 'utf8');

  // 2. Capturar variáveis de ambiente
  const currentVersion = process.env.CURRENT_VERSION;
  const nextVersion = process.env.NEXT_VERSION;
  const releaseType = process.env.RELEASE_TYPE;
  const hasBreaking = process.env.HAS_BREAKING === 'true';

  // 3. Lógica de Emojis
  let impactEmoji = '📦';
  let impactText = 'Patch';
  
  if (releaseType === 'major' || hasBreaking) {
    impactEmoji = '💥';
    impactText = 'Major (Breaking Change)';
  } else if (releaseType === 'minor') {
    impactEmoji = '✨';
    impactText = 'Minor (New Feature)';
  } else if (releaseType === 'patch') {
    impactEmoji = '🐛';
    impactText = 'Patch (Bug Fix)';
  }

  // 4. Montar o corpo do comentário com a ASSINATURA escondida
  const body = `## ${impactEmoji} Version Impact Analysis

**Current Version:** \`v${currentVersion}\`  
**Predicted Version:** \`v${nextVersion}\`  
**Release Type:** **${impactText}**

${hasBreaking ? '> ⚠️ **WARNING:** This PR contains BREAKING CHANGES!' : ''}

---

${summary}

---

*🤖 This comment is automatically updated.*`;

  // 5. Enviar para o output do GitHub Actions
  core.setOutput('comment_body', body);
};