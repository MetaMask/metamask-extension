#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');

const HOOK_NAMES = new Set(['useAppDispatch', 'useAppSelector']);
const TYPE_NAMES = new Set(['MetaMaskReduxDispatch', 'MetaMaskReduxState']);

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (
      entry.name === 'node_modules' ||
      entry.name === 'dist' ||
      entry.name === 'build'
    ) {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
    } else if (/\.(ts|tsx|js)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

function getRelativeStorePath(filePath, target) {
  const fileDir = path.dirname(filePath);
  let rel = path.relative(fileDir, path.join(root, 'ui/store', target));
  if (!rel.startsWith('.')) {
    rel = `./${rel}`;
  }
  rel = rel.replace(/\\/g, '/').replace(/\.ts$/, '');
  return rel;
}

function parseNamedImport(importLine) {
  const match = importLine.match(
    /^import\s+(type\s+)?\{([^}]+)\}\s+from\s+['"]([^'"]+)['"];?$/,
  );
  if (!match) {
    return null;
  }
  const names = match[2]
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const typePrefix = part.startsWith('type ');
      const cleaned = typePrefix ? part.slice(5).trim() : part;
      const aliasMatch = cleaned.match(/^(\w+)(?:\s+as\s+(\w+))?$/);
      return {
        original: part,
        name: aliasMatch?.[1] ?? cleaned,
        alias: aliasMatch?.[2],
        isTypeOnly: typePrefix || Boolean(match[1]),
      };
    });
  return { names, source: match[3], isTypeOnlyImport: Boolean(match[1]) };
}

function formatNamedImport(names, source) {
  const body = names.map((entry) => entry.original).join(', ');
  const typeOnly = names.every((entry) => entry.isTypeOnly);
  const prefix = typeOnly ? 'import type' : 'import';
  return `${prefix} { ${body} } from '${source}';`;
}

function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  content = content.replace(
    /jest\.mock\((['"])([^'"]*\/store\/store)\1,\s*\(\)\s*=>\s*\(\{[\s\S]*?\.\.\.jest\.requireActual\(\2\),[\s\S]*?useAppDispatch:\s*jest\.fn\(\),?[\s\S]*?\}\)\);/g,
    (block, quote, mockPath) => {
      const hooksPath = mockPath.replace(/\/store\/store$/, '/store/hooks');
      return `jest.mock(${quote}${hooksPath}${quote}, () => ({
  useAppDispatch: jest.fn().mockReturnValue((action) => {
    if (typeof action === 'function') {
      return action(jest.fn(), jest.fn());
    }
    return action;
  }),
  useAppSelector: jest.fn(),
}));`;
    },
  );

  const lines = content.split('\n');
  const newLines = [];

  for (const line of lines) {
    if (!line.includes('store/store')) {
      newLines.push(line);
      continue;
    }

    const parsed = parseNamedImport(line.trim());
    if (!parsed || !parsed.source.endsWith('store/store')) {
      newLines.push(line);
      continue;
    }

    const hooks = parsed.names.filter((entry) => HOOK_NAMES.has(entry.name));
    const types = parsed.names.filter((entry) => TYPE_NAMES.has(entry.name));
    const others = parsed.names.filter(
      (entry) => !HOOK_NAMES.has(entry.name) && !TYPE_NAMES.has(entry.name),
    );

    if (hooks.length === 0) {
      newLines.push(line);
      continue;
    }

    if (types.length > 0) {
      const typesPath = getRelativeStorePath(filePath, 'types.ts');
      newLines.push(
        formatNamedImport(
          types.map((entry) => ({ ...entry, isTypeOnly: true })),
          typesPath,
        ),
      );
    }

    const hooksPath = getRelativeStorePath(filePath, 'hooks.ts');
    newLines.push(formatNamedImport(hooks, hooksPath));

    if (others.length > 0) {
      newLines.push(formatNamedImport(others, parsed.source));
    }
  }

  content = newLines.join('\n');

  content = content.replace(
    /from\s+['"]([^'"]*\/store\/store)['"];/g,
    (match, source) => {
      if (
        match.includes('useAppDispatch') ||
        match.includes('useAppSelector')
      ) {
        return match;
      }
      return match;
    },
  );

  content = content.replace(
    /import\s+\{\s*useAppDispatch\s*\}\s+from\s+['"]([^'"]*\/store\/store)['"];/g,
    (_match, source) => {
      const hooksPath = source.replace(/\/store\/store$/, '/store/hooks');
      return `import { useAppDispatch } from '${hooksPath}';`;
    },
  );

  content = content.replace(
    /import\s+\{\s*useAppSelector\s*\}\s+from\s+['"]([^'"]*\/store\/store)['"];/g,
    (_match, source) => {
      const hooksPath = source.replace(/\/store\/store$/, '/store/hooks');
      return `import { useAppSelector } from '${hooksPath}';`;
    },
  );

  content = content.replace(
    /import\s+\{\s*useAppDispatch,\s*useAppSelector\s*\}\s+from\s+['"]([^'"]*\/store\/store)['"];/g,
    (_match, source) => {
      const hooksPath = source.replace(/\/store\/store$/, '/store/hooks');
      return `import { useAppDispatch, useAppSelector } from '${hooksPath}';`;
    },
  );

  content = content.replace(
    /import\s+\{\s*useAppSelector,\s*useAppDispatch\s*\}\s+from\s+['"]([^'"]*\/store\/store)['"];/g,
    (_match, source) => {
      const hooksPath = source.replace(/\/store\/store$/, '/store/hooks');
      return `import { useAppSelector, useAppDispatch } from '${hooksPath}';`;
    },
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    return true;
  }
  return false;
}

const targets = [path.join(root, 'ui'), path.join(root, 'test')];
let changed = 0;
for (const target of targets) {
  for (const file of walk(target)) {
    if (file.endsWith('ui/store/store.ts')) {
      continue;
    }
    if (migrateFile(file)) {
      changed += 1;
    }
  }
}

console.log(`Updated ${changed} files`);
