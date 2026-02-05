// #!/usr/bin/env node
// import conventionalRecommendedBump from 'conventional-recommended-bump';

// const options = {
//   preset: {
//     name: 'custom',
//     parserOpts: {
//       headerPattern: /^(\w*)(?:\((.*)\))?!?: (.*)$/,
//       headerCorrespondence: ['type', 'scope', 'subject']
//     },
//     recommendedBumpOpts: {
//       whatBump: (commits) => {
//         const mappings = {
//           'fix!': 0,
//           'feat!': 0,
//           'feat': 1,
//           'fix': 2,
//           'refactor': 2,
//           'revert': 2,
//         };
        
//         let level = 3; // 3 = no bump
        
//         commits.forEach(commit => {
//           const type = commit.type;
//           if (mappings[type] !== undefined && mappings[type] < level) {
//             level = mappings[type];
//           }
//         });
        
//         return { level };
//       }
//     }
//   }
// };

// conventionalRecommendedBump(options, (err, result) => {
//   if (err) {
//     console.error('Error:', err);
//     process.exit(1);
//   }
  
//   // Mapeia level para release type
//   const releaseTypes = ['major', 'minor', 'patch'];
//   const releaseType = result.level !== undefined && result.level < 3 
//     ? releaseTypes[result.level] 
//     : 'none';
  
//   console.log(releaseType);
// });
