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
  }

  // 4. Montagem do corpo do comentário
  const body = `## ${impactEmoji} Version Impact Analysis

**Current Version:** \`v${currentVersion}\`  
**Predicted Version:** \`v${nextVersion}\`  
**Release Type:** **${impactText}**

${hasBreaking ? '> ⚠️ **WARNING:** This PR contains BREAKING CHANGES!' : ''}


${commentTag}`;

const pullRequestNumber = context.payload.pull_request.number;
  if (!pullRequestNumber) {
    return core.setFailed("Não foi possível encontrar o número do PR.");
  }

  // 1. Buscar comentários existentes no PR
  const { data: comments } = await github.rest.issues.listComments({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: pullRequestNumber,
  });

  // 2. Tentar encontrar o comentário anterior do bot com a nossa TAG
  const botComment = comments.find(comment => 
    comment.user.login === 'github-actions[bot]' && 
    comment.body.includes(commentTag)
  );

  if (botComment) {
    // 3. Se existe, atualiza (Edita)
    await github.rest.issues.updateComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      comment_id: botComment.id,
      body: body
    });
    console.log(`Comentário #${botComment.id} atualizado.`);
  } else {
    // 4. Se não existe, cria um novo
    await github.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: pullRequestNumber,
      body: body
    });
  }
};