#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');

const dispatchMock = `jest.mock('$HOOKS_PATH', () => ({
  useAppDispatch: jest.fn(),
}));`;

const dispatchThunkMock = `jest.mock('$HOOKS_PATH', () => ({
  useAppDispatch: jest.fn().mockReturnValue((action) => {
    if (typeof action === 'function') {
      return action(jest.fn(), jest.fn());
    }
    return action;
  }),
}));`;

const selectorMock = `jest.mock('$HOOKS_PATH', () => ({
  useAppSelector: jest.fn(),
}));`;

const bothMock = `jest.mock('$HOOKS_PATH', () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}));`;

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules') {
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

function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  content = content.replace(
    /import\s+configureStore,\s*\{\s*useAppDispatch\s*\}\s+from\s+(['"])([^'"]*\/store\/store)\1;/g,
    (_match, quote, source) => {
      const hooksPath = source.replace(/\/store\/store$/, '/store/hooks');
      return `import configureStore from ${quote}${source}${quote};\nimport { useAppDispatch } from ${quote}${hooksPath}${quote};`;
    },
  );

  content = content.replace(
    /jest\.mock\((['"])([^'"]*\/store\/store)\1,\s*\(\)\s*=>\s*\(\{[\s\S]*?useAppDispatch:\s*jest\.fn\(\),?[\s\S]*?\}\)\);/g,
    (_block, _quote, mockPath) => {
      const hooksPath = mockPath.replace(/\/store\/store$/, '/store/hooks');
      const useThunk =
        filePath.includes('multichain-private-key-list.test') ||
        filePath.includes('delete-metametrics-data-button.test');
      const template = useThunk ? dispatchThunkMock : dispatchMock;
      return template.replace(/\$HOOKS_PATH/g, hooksPath);
    },
  );

  content = content.replace(
    /jest\.mock\((['"])([^'"]*\/store\/store)\1,\s*\(\)\s*=>\s*\{[\s\S]*?useAppSelector:\s*jest\.fn\(\),?[\s\S]*?\}\);/g,
    (_block, _quote, mockPath) => {
      const hooksPath = mockPath.replace(/\/store\/store$/, '/store/hooks');
      return selectorMock.replace(/\$HOOKS_PATH/g, hooksPath);
    },
  );

  content = content.replace(
    /jest\.mock\((['"])([^'"]*\/store\/store)\1,\s*\(\)\s*=>\s*\(\{[\s\S]*?useAppSelector:\s*jest\.fn\(\),?[\s\S]*?\}\)\);/g,
    (_block, _quote, mockPath) => {
      const hooksPath = mockPath.replace(/\/store\/store$/, '/store/hooks');
      return selectorMock.replace(/\$HOOKS_PATH/g, hooksPath);
    },
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    return true;
  }
  return false;
}

let changed = 0;
for (const file of walk(path.join(root, 'ui'))) {
  if (migrateFile(file)) {
    changed += 1;
  }
}
console.log(`Updated ${changed} test files`);
