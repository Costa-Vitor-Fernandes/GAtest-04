import semver from 'semver';
import { execSync } from 'child_process';
import fs from 'fs';

// BASE_TAG: commit hash or tag reference (e.g., "739431593c8d52063b1f757975c0d47fc12007f9" or "v0.0.1")
// BASE_VERSION: the semantic version at that tag/commit (e.g., "0.0.1")
const baseTag = process.env.BASE_TAG || '739431593c8d52063b1f757975c0d47fc12007f9';
const baseVersion = process.env.BASE_VERSION || '0.0.1';

function getCommitsFromTag() {
  try {
    const output = execSync(`git log ${baseTag}..HEAD --format=%H%n%s%n%b%n---END--- --no-merges`, { encoding: 'utf-8' })
      .trim();
    
    if (!output) {
      return [];
    }

    const commits = [];
    const blocks = output.split('---END---').filter(Boolean);
    
    for (const block of blocks) {
      const lines = block.trim().split('\n');
      if (lines.length < 2) continue;
      
      const sha = lines[0];
      const subject = lines[1];
      const body = lines.slice(2).join('\n').trim();
      
      commits.push({
        sha: sha,
        message: body ? `${subject}\n${body}` : subject
      });
    }
    
    return commits;
  } catch (error) {
    console.error('Error getting commits from git:', error.message);
    return [];
  }
}

function analyzeCommitMessage(message) {
  const lines = message.split('\n');
  const firstLine = lines[0];
  
  // Regex para Conventional Commits
  const pattern = /^(\w+)(?:\((.+)\))?(!?): (.+)/;
  const match = firstLine.match(pattern);
  
  if (!match) {
    return { valid: false };
  }

  const [_, type, scope, breakingExclamation, description] = match;
  
  const types = ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert'];
  
  if (!types.includes(type)) {
    return { valid: false };
  }

  // Verifica BREAKING CHANGE no rodapé ou "!" no cabeçalho
  const hasBreakingFooter = message.includes('BREAKING CHANGE:');
  const isBreaking = breakingExclamation === '!' || hasBreakingFooter;   

  return { 
    valid: true, 
    type, 
    breaking: isBreaking, 
    isMinor: type === 'feat' 
  };
}
function determineVersionBump(commits, prTitle) {
  let bump = 'patch'; 
  const invalidItems = [];

  // Criamos uma lista unificada: o título do PR + todos os commits
  // Isso garante que NADA escape da validação
  const itemsToAnalyze = [
    { sha: 'PR_TITLE', message: prTitle },
    ...commits
  ];

  for (const item of itemsToAnalyze) {
    if (!item.message) continue; // Pula se o título do PR for nulo

    const analysis = analyzeCommitMessage(item.message);

    if (!analysis.valid) {
      invalidItems.push({
        sha: item.sha.substring(0, 7),
        message: item.message.split('\n')[0]
      });
      continue;
    }

    // Hierarquia rigorosa: Major > Minor > Patch
    if (analysis.breaking) {
      bump = 'major';
    } else if (analysis.isMinor && bump !== 'major') {
      bump = 'minor';
    } 
  }

  return { bump, invalidItems };
}

function getCurrentVersion() {
  if (!semver.valid(baseVersion)) {
    throw new Error(`Invalid semver BASE_VERSION: ${baseVersion}`);
  }
  return baseVersion;
}

function writeOutput(comment) {
  const delimiter = `ghadelimiter_${Math.random().toString(36).substring(7)}`;
  const output = `comment<<${delimiter}\n${comment}\n${delimiter}\n`;
  fs.appendFileSync(process.env.GITHUB_OUTPUT, output);
}

function main() {
  try {
    const commits = getCommitsFromTag();
    
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

    const currentVersion = getCurrentVersion();
    const nextVersion = semver.inc(currentVersion, bump);
    const impact = { major: 'Major', minor: 'Minor', patch: 'Patch' }[bump];

    const comment = `✅ **Previsão de Versão**

Oi! Este PR vai gerar a versão **v${nextVersion}**.

📊 **Impacto:** ${impact}
📌 Estávamos na **v${currentVersion}** e vamos para **v${nextVersion}**`;

    console.log(`Current version: v${currentVersion}`);
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