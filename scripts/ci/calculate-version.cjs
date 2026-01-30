import semver from 'semver';
import { execSync } from 'child_process';
import fs from 'fs';

// BASE_TAG: commit hash ou tag (v0.0.1)
// BASE_VERSION: versão semântica (0.0.1)
const baseTag = process.env.BASE_TAG || 'v0.0.1'; // MUDAR: usa 'v0.0.1' não hash
const baseVersion = process.env.BASE_VERSION || '0.0.1';
const PR_TITLE = process.env.PR_TITLE;

function getCommitsFromTag() {
  try {
    // MUDAR: Pega commits desde a tag, não desde hash
    const output = execSync(`git log ${baseTag}..HEAD --oneline --format="%s" --no-merges`, { 
      encoding: 'utf-8' 
    }).trim();
    
    return output ? output.split('\n') : [];
  } catch (error) {
    console.error('Erro ao buscar commits:', error.message);
    return [];
  }
}

function analyzeCommitMessage(message) {
  const firstLine = message.split('\n')[0];
  
  const types = ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert'];
  const typeMatch = types.find(type => firstLine.startsWith(`${type}:`) || firstLine.startsWith(`${type}(`));
  
  if (!typeMatch) {
    return { valid: false, type: null, breaking: false };
  }

  const hasExclamation = firstLine.includes('!:');
  const hasBreakingFooter = message.includes('BREAKING CHANGE:');
  const isMinor = firstLine.includes('feat')
  const breaking = hasExclamation || hasBreakingFooter;

  return { valid: true, type: typeMatch, breaking, isMinor };
}

function determineVersionBump(commits) {
  let bump = 'patch';
  const invalidCommits = [];

  for (const commit of commits) {
    const analysis = analyzeCommitMessage(commit);

    if (!analysis.valid) {
      invalidCommits.push({
        sha: commit.substring(0, 7),
        message: commit.split('\n')[0]
      });
      continue;
    }

    if (analysis.breaking) {
      bump = 'major';
    } 
    else if(analysis.isMinor) bump = 'minor'
    else if (analysis.type === 'fix') bump = 'patch';
    
  }

  return { bump, invalidCommits };
}

function writeOutput(comment) {
  const delimiter = `ghadelimiter_${Math.random().toString(36).substring(7)}`;
  const output = `comment<<${delimiter}\n${comment}\n${delimiter}\n`;
  fs.appendFileSync(process.env.GITHUB_OUTPUT, output);
}

function main() {
  try {
    // MUDAR: Pega commits desde a tag
    const commits = getCommitsFromTag();
    
    // MUDAR: Inclui título do PR
    if (PR_TITLE && !commits.includes(PR_TITLE)) {
      commits.unshift(PR_TITLE);
    }
    
    if (commits.length === 0) {
      const comment = '⚠️ Nenhum commit encontrado neste Pull Request.';
      writeOutput(comment);
      return;
    }

    const { bump, invalidCommits } = determineVersionBump(commits);

    if (invalidCommits.length > 0) {
      const commitList = invalidCommits
        .map(c => `- \`${c.sha}\`: ${c.message}`)
        .join('\n');
      
      const comment = `❌ **Commits inválidos detectados**

Os seguintes commits não seguem o padrão Conventional Commits:

${commitList}

📖 Consulte: https://www.conventionalcommits.org/`;
      
      console.error('Invalid commits found:', invalidCommits);
      writeOutput(comment);
      process.exit(1);
    }

    const nextVersion = semver.inc(baseVersion, bump);
    const impact = { major: 'Major', minor: 'Minor', patch: 'Patch' }[bump];

    const comment = `✅ **Previsão de Versão**

Oi! Este PR vai gerar a versão **v${nextVersion}**.

📊 **Impacto:** ${impact}
📌 Estávamos na **v${baseVersion}** e vamos para **v${nextVersion}**`;

    console.log(`Current version: v${baseVersion}`);
    console.log(`Next version: v${nextVersion}`);
    console.log(`Bump type: ${bump}`);
    
    writeOutput(comment);
  } catch (error) {
    console.error('Error in main execution:', error);
    const comment = `❌ **Erro ao calcular versão**\n\n${error.message}`;
    writeOutput(comment);
    process.exit(1);
  }
}

main();