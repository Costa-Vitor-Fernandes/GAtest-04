module.exports = async ({ github, context, core }) => {
  const fs = require('fs');
  const commentTag = '🤖 This comment is automatically updated.';
  
  // 2. Capturar variáveis de ambiente do YAML
  const currentVersion = process.env.CURRENT_VERSION;
  const nextVersion = process.env.NEXT_VERSION;
  const releaseType = process.env.RELEASE_TYPE;
  const hasBreaking = process.env.HAS_BREAKING === 'true';

  // 3. Lógica visual (Emojis e Texto)
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
  } else if (releaseType === 'no-bump'){
    impactEmoji = '✅';
    impactText = 'No changes'
  }

  // 4. Montagem do corpo do comentário
  const body = `## ${impactEmoji} Version Impact Analysis

**Current Version:** \`v${currentVersion}\`  
**Predicted Version:** \`v${nextVersion}\`  
**Release Type:** **${impactText}**

${hasBreaking ? '> ⚠️ **WARNING:** This PR contains BREAKING CHANGES!' : ''}


${commentTag}`;

core.setOutput('comment_body', body);
};