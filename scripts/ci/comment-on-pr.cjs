            const fs = require('fs');
            const summary = fs.readFileSync('version-summary.txt', 'utf8');
            console.warn('GITHUB_BASE_REF:', process.env.GITHUB_BASE_REF);
            
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

            *🤖 This comment is automatically updated.*
            `;

            // Procura comentários existentes do bot
            const { data: comments } = await github.rest.issues.listComments({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
            });

            const botComment = comments.find(comment => 
              comment.user.type === 'Bot' && 
              comment.body.includes('Version Impact Analysis')
            );

            if (botComment) {
              // Atualiza comentário existente
              await github.rest.issues.updateComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                comment_id: botComment.id,
                body: body
              });
            } else {
              // Cria novo comentário
              await github.rest.issues.createComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: context.issue.number,
                body: body
              });
            }  