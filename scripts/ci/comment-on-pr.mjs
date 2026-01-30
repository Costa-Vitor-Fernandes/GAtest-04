module.exports = async ({ github, context, core }) => {
  const fs = require('fs');
  const summary = fs.readFileSync('version-summary.txt', 'utf8');

  const currentVersion = process.env.CURRENT_VERSION;
  const nextVersion = process.env.NEXT_VERSION;
  const releaseType = process.env.RELEASE_TYPE;
  const hasBreaking = process.env.HAS_BREAKING === 'true';

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

  const body = `## ${impactEmoji} Version Impact Analysis

**Current Version:** \`v${currentVersion}\`  
**Predicted Version:** \`v${nextVersion}\`  
**Release Type:** **${impactText}**

${hasBreaking ? '> ⚠️ **WARNING:** This PR contains BREAKING CHANGES!' : ''}

---

${summary}

---

*🤖 This comment is automatically updated.*`;

  // Define o output para ser usado no próximo step
  core.setOutput('comment_body', body);
};