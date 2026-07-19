const fs = require('fs');
const path = require('path');

const rootDir = 'd:/Gamefi/Archery-dApp';

const files = {
  'pnpm-workspace.yaml': `packages:
  - "apps/*"
  - "packages/*"
`,
  'package.json': `{
  "name": "archery-dapp",
  "private": true,
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test"
  },
  "devDependencies": {
    "turbo": "latest",
    "typescript": "latest",
    "@types/node": "latest",
    "prettier": "latest"
  },
  "packageManager": "pnpm@9.0.0"
}
`,
  'turbo.json': `{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"]
    }
  }
}
`,
  '.npmrc': `auto-install-peers=true
link-workspace-packages=true
`,
  '.gitignore': `node_modules
dist
.next
.turbo
*.log
.env
coverage
`,
  '.editorconfig': `root = true

[*]
charset = utf-8
indent_style = space
indent_size = 2
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false
`,
  'packages/config/package.json': `{
  "name": "@archery/config",
  "version": "0.0.0",
  "private": true,
  "main": "index.js",
  "dependencies": {
    "eslint": "latest",
    "eslint-config-prettier": "latest"
  }
}
`,
  'packages/config/tsconfig.base.json': `{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true
  }
}
`,
  'packages/config/eslint-preset.js': `module.exports = {
  extends: ["eslint:recommended", "prettier"],
  env: {
    node: true,
    es6: true
  },
  parserOptions: {
    ecmaVersion: "latest"
  }
};
`,
  'packages/config/prettier-preset.js': `module.exports = {
  semi: true,
  trailingComma: "all",
  singleQuote: true,
  printWidth: 100,
  tabWidth: 2
};
`,
  'packages/types/package.json': `{
  "name": "@archery/types",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "lint": "eslint \\"src/**/*.ts\\"",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "@archery/config": "workspace:*",
    "typescript": "latest"
  }
}
`,
  'packages/types/tsconfig.json': `{
  "extends": "@archery/config/tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "baseUrl": "."
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
`,
  'packages/types/src/index.ts': `export interface UserProfile {
  id: string;
  username: string;
}
`,
  'packages/utils/package.json': `{
  "name": "@archery/utils",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "lint": "eslint \\"src/**/*.ts\\"",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@archery/types": "workspace:*"
  },
  "devDependencies": {
    "@archery/config": "workspace:*",
    "typescript": "latest"
  }
}
`,
  'packages/utils/tsconfig.json': `{
  "extends": "@archery/config/tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "baseUrl": "."
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
`,
  'packages/utils/src/index.ts': `export const calculateScore = () => 0;
`,
  'packages/ui/package.json': `{
  "name": "@archery/ui",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "lint": "eslint \\"src/**/*.ts\\"",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "@archery/config": "workspace:*",
    "typescript": "latest",
    "react": "latest",
    "@types/react": "latest"
  },
  "peerDependencies": {
    "react": "^18.0.0"
  }
}
`,
  'packages/ui/tsconfig.json': `{
  "extends": "@archery/config/tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "jsx": "react-jsx",
    "baseUrl": "."
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
`,
  'packages/ui/src/index.ts': `export const Button = () => null;
`,
  'packages/game-engine/package.json': `{
  "name": "@archery/game-engine",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "lint": "eslint \\"src/**/*.ts\\"",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@archery/types": "workspace:*",
    "three": "latest"
  },
  "devDependencies": {
    "@archery/config": "workspace:*",
    "typescript": "latest"
  }
}
`,
  'packages/game-engine/tsconfig.json': `{
  "extends": "@archery/config/tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "baseUrl": "."
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
`,
  'packages/game-engine/src/index.ts': `export class GameEngine {}
`,
  'packages/blockchain-sdk/package.json': `{
  "name": "@archery/blockchain-sdk",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "lint": "eslint \\"src/**/*.ts\\"",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@archery/types": "workspace:*",
    "@archery/contracts": "workspace:*"
  },
  "devDependencies": {
    "@archery/config": "workspace:*",
    "typescript": "latest"
  }
}
`,
  'packages/blockchain-sdk/tsconfig.json': `{
  "extends": "@archery/config/tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "baseUrl": "."
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
`,
  'packages/blockchain-sdk/src/index.ts': `export const connectWallet = () => {};
`,
  'packages/contracts/package.json': `{
  "name": "@archery/contracts",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "lint": "eslint \\"src/**/*.ts\\"",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "@archery/config": "workspace:*",
    "typescript": "latest"
  }
}
`,
  'packages/contracts/tsconfig.json': `{
  "extends": "@archery/config/tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "baseUrl": "."
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
`,
  'packages/contracts/src/index.ts': `export const ABIs = {};
`,
  'apps/web/package.json': `{
  "name": "web",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@archery/ui": "workspace:*",
    "@archery/types": "workspace:*",
    "@archery/blockchain-sdk": "workspace:*",
    "@archery/game-engine": "workspace:*",
    "next": "latest",
    "react": "latest",
    "react-dom": "latest"
  },
  "devDependencies": {
    "@archery/config": "workspace:*",
    "@types/node": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "typescript": "latest"
  }
}
`,
  'apps/web/tsconfig.json': `{
  "extends": "@archery/config/tsconfig.base.json",
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
`,
  'apps/web/src/app/page.tsx': `export default function Home() {
  return (
    <main>
      <h1>Archery GameFi</h1>
    </main>
  );
}
`,
  'apps/web/src/app/layout.tsx': `export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
`,
  'apps/api/package.json': `{
  "name": "api",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "build": "tsc",
    "start": "node dist/main",
    "dev": "tsc --watch",
    "lint": "eslint \\"src/**/*.ts\\"",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@archery/types": "workspace:*",
    "@archery/blockchain-sdk": "workspace:*"
  },
  "devDependencies": {
    "@archery/config": "workspace:*",
    "@types/node": "latest",
    "typescript": "latest"
  }
}
`,
  'apps/api/tsconfig.json': `{
  "extends": "@archery/config/tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "baseUrl": "."
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
`,
  'apps/api/src/main.ts': `console.log("API Starting...");
`,
  'Dockerfile': `FROM node:18-alpine AS base
# This is a placeholder Dockerfile
`,
  'docker-compose.yml': `version: '3.8'
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: archery
    ports:
      - "5432:5432"
  redis:
    image: redis:7
    ports:
      - "6379:6379"
`,
  '.github/workflows/ci.yml': `name: CI

on:
  push:
    branches: ["main"]
  pull_request:
    branches: ["main"]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm build
      - run: pnpm lint
      - run: pnpm typecheck
`,
  'README.md': `# Archery GameFi
See docs/INSTALLATION.md for setup.
`,
  'docs/INSTALLATION.md': `# Installation
Run \`pnpm install\` and \`pnpm dev\`.
`
};

for (const [filepath, content] of Object.entries(files)) {
  const fullPath = path.join(rootDir, filepath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content);
}
console.log('Project setup complete.');
