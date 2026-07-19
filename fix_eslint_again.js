const fs = require('fs');
const path = require('path');

const rootDir = 'd:/Gamefi/Archery-dApp';

// Rename config/index.js to eslint-preset.js
const configDir = path.join(rootDir, 'packages/config');
if (fs.existsSync(path.join(configDir, 'index.js'))) {
  fs.renameSync(path.join(configDir, 'index.js'), path.join(configDir, 'eslint-preset.js'));
}

// Update all .eslintrc.js
const packages = [
  'packages/types',
  'packages/utils',
  'packages/ui',
  'packages/game-engine',
  'packages/blockchain-sdk',
  'packages/contracts',
  'packages/api-client',
  'apps/web',
  'apps/api'
];

for (const pkg of packages) {
  const eslintrcPath = path.join(rootDir, pkg, '.eslintrc.js');
  fs.writeFileSync(eslintrcPath, `module.exports = {
  extends: [require.resolve("@archery/config/eslint-preset.js")],
  ignorePatterns: ["dist", ".next", "node_modules"],
};
`);
}

// Ensure eslint-preset.js has the right content
fs.writeFileSync(path.join(configDir, 'eslint-preset.js'), `module.exports = {
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier"],
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

console.log('Fixed ESLint config resolution again.');
