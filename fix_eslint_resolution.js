const fs = require('fs');
const path = require('path');

const rootDir = 'd:/Gamefi/Archery-dApp';

// Rename eslint-preset.js to index.js
const configDir = path.join(rootDir, 'packages/config');
fs.renameSync(path.join(configDir, 'eslint-preset.js'), path.join(configDir, 'index.js'));

// Update all .eslintrc.js
const packages = [
  'packages/types',
  'packages/utils',
  'packages/ui',
  'packages/game-engine',
  'packages/blockchain-sdk',
  'packages/contracts',
  'apps/web',
  'apps/api'
];

for (const pkg of packages) {
  const eslintrcPath = path.join(rootDir, pkg, '.eslintrc.js');
  fs.writeFileSync(eslintrcPath, `module.exports = {
  extends: ["@archery/config"],
  ignorePatterns: ["dist", ".next", "node_modules"],
};
`);
}

console.log('Fixed ESLint config resolution.');
