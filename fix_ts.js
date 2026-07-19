const fs = require('fs');
const path = require('path');

const rootDir = 'd:/Gamefi/Archery-dApp';

// Fix tsconfig.base.json
const baseTsConfigPath = path.join(rootDir, 'packages/config/tsconfig.base.json');
let baseTsConfig = JSON.parse(fs.readFileSync(baseTsConfigPath, 'utf8'));
baseTsConfig.compilerOptions.moduleResolution = 'bundler';
fs.writeFileSync(baseTsConfigPath, JSON.stringify(baseTsConfig, null, 2));

// Fix all baseUrl
const packages = [
  'packages/types',
  'packages/utils',
  'packages/ui',
  'packages/game-engine',
  'packages/blockchain-sdk',
  'packages/contracts',
  'apps/api'
];

for (const pkg of packages) {
  const tsConfigPath = path.join(rootDir, pkg, 'tsconfig.json');
  let tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));
  
  if (tsConfig.compilerOptions && tsConfig.compilerOptions.baseUrl) {
    delete tsConfig.compilerOptions.baseUrl;
    // TypeScript suggests adding paths: {"*": ["./*"]} instead of baseUrl, but it might not be needed.
    // Let's add it to be safe.
    tsConfig.compilerOptions.paths = { "*": ["./*"] };
    fs.writeFileSync(tsConfigPath, JSON.stringify(tsConfig, null, 2));
  }
}

console.log('TSConfig fixed.');
