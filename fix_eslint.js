const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = 'd:/Gamefi/Archery-dApp';

// Downgrade ESLint in packages/config
const configPkgPath = path.join(rootDir, 'packages/config/package.json');
let configPkg = JSON.parse(fs.readFileSync(configPkgPath, 'utf8'));
configPkg.dependencies['eslint'] = '^8.57.0';
configPkg.dependencies['eslint-config-prettier'] = '^8.10.0';
fs.writeFileSync(configPkgPath, JSON.stringify(configPkg, null, 2));

// Add .eslintrc.js to all packages
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
  extends: ["@archery/config/eslint-preset.js"],
  ignorePatterns: ["dist", ".next", "node_modules"],
};
`);
}

// Ensure the preset is correct for eslint 8
const presetPath = path.join(rootDir, 'packages/config/eslint-preset.js');
fs.writeFileSync(presetPath, `module.exports = {
  extends: ["eslint:recommended", "prettier"],
  env: {
    node: true,
    es6: true,
    browser: true
  },
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module"
  }
};
`);

console.log('Fixed ESLint config.');
