          const { execSync } = require('child_process');

          function generateSummary() {
            console.warn('GITHUB_BASE_REF:', process.env.GITHUB_BASE_REF)
            const commits = execSync(`git log origin/${process.env.GITHUB_BASE_REF}..HEAD --format=%s`)
              .toString()
              .trim()
              .split('\n');

            const types = {
              feat: [],
              fix: [],
              docs: [],
              style: [],
              refactor: [],
              perf: [],
              test: [],
              chore: [],
              ci: [],
              build: [],
              revert: []
            };

            commits.forEach(commit => {
              const match = commit.match(/^(\w+)(?:\(.+\))?!?:\s*(.+)$/);
              if (match) {
                const [, type, message] = match;
                if (types[type]) {
                  types[type].push(message);
                }
              }
            });

            let summary = '';
            
            if (types.feat.length > 0) {
              summary += '### ✨ Features\n';
              types.feat.forEach(msg => summary += `- ${msg}\n`);
              summary += '\n';
            }
            
            if (types.fix.length > 0) {
              summary += '### 🐛 Fixes\n';
              types.fix.forEach(msg => summary += `- ${msg}\n`);
              summary += '\n';
            }
            
            if (types.perf.length > 0) {
              summary += '### ⚡ Performance\n';
              types.perf.forEach(msg => summary += `- ${msg}\n`);
              summary += '\n';
            }

            const otherTypes = ['docs', 'style', 'refactor', 'test', 'chore', 'ci', 'build'];
            const hasOthers = otherTypes.some(type => types[type].length > 0);
            
            if (hasOthers) {
              summary += '### 🔧 Other Changes\n';
              otherTypes.forEach(type => {
                types[type].forEach(msg => summary += `- **${type}**: ${msg}\n`);
              });
            }

            // Salva em arquivo para usar no próximo step
            require('fs').writeFileSync('version-summary.txt', summary);
          }

          generateSummary();