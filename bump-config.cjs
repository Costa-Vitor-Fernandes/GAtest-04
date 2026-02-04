const spec = require('conventional-changelog-conventionalcommits');

module.exports = spec({
  types: [
    { type: 'feat',     release: 'minor' },
    { type: 'fix',      release: 'patch' },
    { type: 'perf',     release: 'patch' },
    { type: 'refactor', release: 'patch' },
    { type: 'docs',     release: false }, // não sobe versão
    { type: 'chore',    release: false },
    { type: 'ci',       release: false },
    { type: 'style',    release: false },
    { type: 'test',     release: false },
  ]
});