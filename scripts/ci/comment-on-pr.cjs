module.exports = async ({ github, context, core }) => {
  const fs = require('fs');
  
  // 1. Ler o resumo gerado anteriormente
  const summary = fs.readFileSync('version-summary.txt', 'utf8');

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
  }

  // 4. Montagem do corpo do comentário
  const body = `## ${impactEmoji} Version Impact Analysis

**Current Version:** \`v${currentVersion}\`  
**Predicted Version:** \`v${nextVersion}\`  
**Release Type:** **${impactText}**

${hasBreaking ? '> ⚠️ **WARNING:** This PR contains BREAKING CHANGES!' : ''}

---

${summary}

---

*🤖 This comment is automatically updated.*`;

  // --- A PARTE QUE FALTA ESTÁ AQUI ---
  
  // 5. Publicar o comentário no Pull Request
  // Verificamos se temos o número do PR no contexto
  const pullRequestNumber = context.payload.pull_request.number;
  
  if (pullRequestNumber) {
    await github.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: pullRequestNumber,
      body: body
    });
    console.log(`Comentário enviado para o PR #${pullRequestNumber}`);
  } else {
    core.setFailed("Não foi possível encontrar o número do Pull Request.");
  }
};