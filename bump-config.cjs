module.exports = {
  whatBump: (commits) => {
    const mappings = {
      'fix!': 0,
      'feat!': 0, // 0 == major
      feat: 1, // 1 == minor
      fix: 2, // 2 == patch
      refactor: 2,
      revert: 2
      // undefined == no-bump
    };

    let level = 2;
    
    commits.forEach(commit => {
      if (mappings[commit.type] !== undefined && mappings[commit.type] < level) {
        level = mappings[commit.type];
      }
    });

    return { level };
  }
};