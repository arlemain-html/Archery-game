const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = 'd:/Gamefi/Archery-dApp';

const packages = [
  'package.json',
  'packages/config/package.json',
  'packages/types/package.json',
  'packages/utils/package.json',
  'packages/ui/package.json',
  'packages/game-engine/package.json',
  'packages/blockchain-sdk/package.json',
  'packages/contracts/package.json',
  'apps/web/package.json',
  'apps/api/package.json'
];

for (const pkg of packages) {
  const filepath = path.join(rootDir, pkg);
  if (!fs.existsSync(filepath)) continue;
  
  let content = fs.readFileSync(filepath, 'utf8');
  let json = JSON.parse(content);
  
  const fixDeps = (deps) => {
    if (!deps) return;
    if (deps['typescript']) deps['typescript'] = '5.4.5';
    if (deps['next']) deps['next'] = '14.2.3';
    if (deps['react']) deps['react'] = '^18.3.1';
    if (deps['react-dom']) deps['react-dom'] = '^18.3.1';
    if (deps['@types/react']) deps['@types/react'] = '^18.3.3';
    if (deps['@types/react-dom']) deps['@types/react-dom'] = '^18.3.0';
    if (deps['@types/node']) deps['@types/node'] = '^20.12.12';
  };
  
  fixDeps(json.dependencies);
  fixDeps(json.devDependencies);
  fixDeps(json.peerDependencies);
  
  fs.writeFileSync(filepath, JSON.stringify(json, null, 2));
}

console.log('Downgraded stable versions.');
