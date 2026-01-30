const conventionalRecommendedBump = require('conventional-recommended-bump');
          const semver = require('semver');
          const { execSync } = require('child_process');
          const fs = require('fs');

          async function calculateVersion() {
            try {
              // Busca a última tag de versão
              let currentVersion = '0.0.0';
              try {
                const latestTag = execSync('git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0"')
                  .toString()
                  .trim()
                  .replace(/^v/, '');
                currentVersion = semver.valid(latestTag) || '0.0.0';
              } catch (e) {
                console.log('Nenhuma tag encontrada, usando 0.0.0');
              }

              console.log(`Versão atual: ${currentVersion}`);

              // Determina o tipo de bump necessário
              const result = await conventionalRecommendedBump({
                preset: 'conventionalcommits',
                tagPrefix: 'v'
              });

              let releaseType = result.releaseType;
              console.log(`Tipo de release recomendado: ${releaseType}`);

              // Calcula a nova versão
              const newVersion = semver.inc(currentVersion, releaseType);
              
              // Detecta breaking changes
              const commits = execSync('git log origin/${{ github.event.pull_request.base.ref }}..HEAD --format=%B')
                .toString();
              const hasBreakingChange = commits.includes('BREAKING CHANGE:') || commits.includes('!:');

              console.log(`Nova versão: ${newVersion}`);
              console.log(`Breaking changes: ${hasBreakingChange}`);
              
              // Output para o GitHub Actions usando $GITHUB_OUTPUT
              const output = `current=${currentVersion}\nnext=${newVersion}\nrelease_type=${releaseType}\nbreaking=${hasBreakingChange}\n`;
              fs.appendFileSync(process.env.GITHUB_OUTPUT, output);

              return { currentVersion, newVersion, releaseType, hasBreakingChange };
            } catch (error) {
              console.error('Erro ao calcular versão:', error);
              process.exit(1);
            }
          }

          calculateVersion();