/**
 * This file was entirely written by AI.
 * Initial prompt: "Help me change lint:changed:fix so it runs on Windows"
 * AI System: VSCode Copilot
 * AI Model: GPT-5.2
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

type LintChangedOptions = {
  fix: boolean;
};

const JS_TS_TSX_SNAP_FILE_REGEX = /\.(js|ts|tsx|snap)$/u;

function runGit(args: string[]): string {
  const result = spawnSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  });

  // Mirror git CLI semantics: non-zero exit should fail this script.
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  return result.stdout;
}

function getChangedFileNames(): string[] {
  const untracked = runGit(['ls-files', '--others', '--exclude-standard'])
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);

  const staged = runGit(['diff', '--name-only', '--cached', '--diff-filter=d'])
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);

  const unstaged = runGit(['diff', '--name-only', '--diff-filter=d'])
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);

  const unique = new Set<string>();
  for (const file of [...untracked, ...staged, ...unstaged]) {
    unique.add(file);
  }

  return [...unique];
}

function parseArgs(argv: string[]): LintChangedOptions {
  return {
    fix: argv.includes('--fix'),
  };
}

function chunkByApproxCommandLength(
  items: string[],
  baseLength: number,
): string[][] {
  const maxLen = process.platform === 'win32' ? 7500 : 100000;

  const chunks: string[][] = [];
  let current: string[] = [];
  let currentLen = baseLength;

  for (const item of items) {
    const itemLen = item.length + 1;

    if (current.length === 0) {
      current.push(item);
      currentLen = baseLength + itemLen;
      continue;
    }

    const nextLen = currentLen + itemLen;
    if (nextLen > maxLen) {
      chunks.push(current);
      current = [item];
      currentLen = baseLength + itemLen;
      continue;
    }

    current.push(item);
    currentLen = nextLen;
  }

  if (current.length > 0) {
    chunks.push(current);
  }

  return chunks;
}

function main(): void {
  const options = parseArgs(process.argv.slice(2));

  const changedFiles = getChangedFileNames().filter((file) =>
    JS_TS_TSX_SNAP_FILE_REGEX.test(file),
  );

  if (changedFiles.length === 0) {
    process.stdout.write('No changed JS/TS/TSX/SNAP files to lint.\n');
    return;
  }

  process.stdout.write(`Linting ${changedFiles.length} changed files:\n`);
  for (const file of changedFiles) {
    process.stdout.write(`${file}\n`);
  }
  process.stdout.write('\n');

  const eslintBin = path.join(
    process.cwd(),
    'node_modules',
    'eslint',
    'bin',
    'eslint.js',
  );
  if (!fs.existsSync(eslintBin)) {
    process.stderr.write(
      `Could not find ESLint at ${eslintBin}. Ensure dependencies are installed (yarn install).\n`,
    );
    process.exit(1);
  }

  const eslintArgsBase = [
    ...(options.fix ? ['--fix'] : []),
    '--cache',
    '--cache-location',
    path.join('node_modules', '.cache', 'eslint', '.eslint-cache'),
  ];

  const eslintArgsWithDelimiter = [...eslintArgsBase, '--'];

  const baseCommandLength =
    process.execPath.length +
    eslintBin.length +
    eslintArgsWithDelimiter.join(' ').length +
    3;
  const fileChunks = chunkByApproxCommandLength(
    changedFiles,
    baseCommandLength,
  );

  let worstExitCode = 0;

  for (const fileChunk of fileChunks) {
    const result = spawnSync(
      process.execPath,
      [eslintBin, ...eslintArgsWithDelimiter, ...fileChunk],
      {
        stdio: 'inherit',
      },
    );

    const exitCode = result.status ?? 1;
    if (exitCode !== 0) {
      worstExitCode = Math.max(worstExitCode, exitCode);
    }
  }

  if (worstExitCode !== 0) {
    process.exit(worstExitCode);
  }
}

main();
