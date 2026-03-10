import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import eslint from 'eslint';
import ts from 'typescript';

const CACHE_LOCATION = path.join('node_modules', '.cache', 'eslint', '.eslint-cache');
const ESLINT_BIN = path.join(
  process.cwd(),
  'node_modules',
  'eslint',
  'bin',
  'eslint.js',
);

const TYPE_SCRIPT_PROJECTS = [
  {
    configPath: path.join(process.cwd(), 'tsconfig.source.json'),
  },
  {
    configPath: path.join(process.cwd(), 'tsconfig.unit.json'),
  },
  {
    configPath: path.join(process.cwd(), 'tsconfig.e2e.json'),
  },
];

const MAX_BUFFER_BYTES = 1024 * 1024 * 250;
const JS_AND_SNAP_FILE_REGEX = /\.(js|snap)$/u;
const PROJECT_FILE_REGEX = /\.(c|m)?(j|t)sx?$/u;

type EslintRunResult = {
  eslintExitCode: number;
  lintResults: unknown[];
  stderr: string;
};

type EslintChunkResult = EslintRunResult & {
  chunkIndex: number;
};

function isIgnoredFileWarningResult(lintResult: unknown): boolean {
  if (
    typeof lintResult !== 'object' ||
    lintResult === null ||
    !('messages' in lintResult)
  ) {
    return false;
  }

  const { messages } = lintResult as { messages: unknown };
  if (!Array.isArray(messages) || messages.length === 0) {
    return false;
  }

  return messages.every((message) => {
    if (
      typeof message !== 'object' ||
      message === null ||
      !('ruleId' in message) ||
      !('message' in message)
    ) {
      return false;
    }

    const { ruleId, message: messageText } = message as {
      ruleId: unknown;
      message: unknown;
    };

    return (
      ruleId === null &&
      typeof messageText === 'string' &&
      messageText.startsWith('File ignored')
    );
  });
}

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/gu, '/');
}

function getDefaultJobCount(): number {
  if (process.env.CI === 'true') {
    return 1;
  }

  const cpuCount =
    typeof os.availableParallelism === 'function'
      ? os.availableParallelism()
      : os.cpus().length;

  return Math.max(1, cpuCount - 1);
}

function parseJobCount(value: string | undefined): number | null {
  if (!value) {
    return null;
  }

  const parsedValue = Number.parseInt(value, 10);
  if (!Number.isFinite(parsedValue) || parsedValue < 1) {
    throw new Error(
      `Invalid LINT_ESLINT_JOBS value "${value}". Expected an integer >= 1.`,
    );
  }

  return parsedValue;
}

function runGit(args: string[]): string {
  const result = spawnSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (result.status !== 0) {
    const stderr = result.stderr.trim();
    throw new Error(stderr ? `git ${args.join(' ')} failed: ${stderr}` : `git ${args.join(' ')} failed`);
  }

  return result.stdout;
}

function getGitFileNames(): string[] {
  return runGit(['ls-files', '--cached', '--others', '--exclude-standard'])
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(normalizePath);
}

function runEslint(args: string[]): Promise<EslintRunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [ESLINT_BIN, '--format', 'json', ...args], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');

    child.stdout.on('data', (chunk) => {
      stdout += chunk;

      if (stdout.length > MAX_BUFFER_BYTES) {
        child.kill();
        reject(
          new Error(
            'ESLint output exceeded maximum buffer while collecting JSON results.',
          ),
        );
      }
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk;

      if (stderr.length > MAX_BUFFER_BYTES) {
        child.kill();
        reject(
          new Error(
            'ESLint stderr exceeded maximum buffer while collecting results.',
          ),
        );
      }
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('close', (code) => {
      const trimmedStdout = stdout.trim();
      let lintResults: unknown[] = [];

      if (trimmedStdout) {
        try {
          lintResults = JSON.parse(trimmedStdout) as unknown[];
        } catch (error) {
          reject(
            new Error(
              `Failed to parse ESLint JSON output: ${
                error instanceof Error ? error.message : String(error)
              }`,
            ),
          );
          return;
        }
      }

      resolve({
        eslintExitCode: code ?? 1,
        lintResults,
        stderr,
      });
    });
  });
}

function getProjectLintFileNames(configPath: string): string[] {
  const readResult = ts.readConfigFile(configPath, ts.sys.readFile);

  if (readResult.error) {
    throw new Error(ts.flattenDiagnosticMessageText(readResult.error.messageText, '\n'));
  }

  const parsedConfig = ts.parseJsonConfigFileContent(
    readResult.config,
    ts.sys,
    path.dirname(configPath),
  );

  return parsedConfig.fileNames
    .filter((fileName) => PROJECT_FILE_REGEX.test(fileName))
    .map((fileName) => normalizePath(path.relative(process.cwd(), fileName)));
}

function chunkByApproxCommandLength(
  items: string[],
  baseLength: number,
): string[][] {
  const maxLen = process.platform === 'win32' ? 7500 : 100000;

  const chunks: string[][] = [];
  let currentChunk: string[] = [];
  let currentLength = baseLength;

  for (const item of items) {
    const itemLength = item.length + 1;

    if (currentChunk.length === 0) {
      currentChunk = [item];
      currentLength = baseLength + itemLength;
      continue;
    }

    if (currentLength + itemLength > maxLen) {
      chunks.push(currentChunk);
      currentChunk = [item];
      currentLength = baseLength + itemLength;
      continue;
    }

    currentChunk.push(item);
    currentLength += itemLength;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}

async function runChunkPool(
  fileChunks: string[][],
  eslintArgsWithDelimiter: string[],
  jobs: number,
): Promise<EslintChunkResult[]> {
  const results: EslintChunkResult[] = [];
  let nextChunkIndex = 0;
  let failedError: Error | null = null;

  async function runWorker() {
    while (failedError === null) {
      const chunkIndex = nextChunkIndex;
      nextChunkIndex += 1;

      if (chunkIndex >= fileChunks.length) {
        return;
      }

      try {
        const chunkResult = await runEslint([
          ...eslintArgsWithDelimiter,
          ...fileChunks[chunkIndex],
        ]);

        results.push({
          chunkIndex,
          ...chunkResult,
        });
      } catch (error) {
        failedError =
          error instanceof Error
            ? error
            : new Error(String(error));
        return;
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(jobs, fileChunks.length) }, () => runWorker()),
  );

  if (failedError) {
    throw failedError;
  }

  return results.sort((a, b) => a.chunkIndex - b.chunkIndex);
}

async function main() {
  const fix = process.argv.includes('--fix');
  const { ESLint } = eslint;
  const configuredJobCount = parseJobCount(process.env.LINT_ESLINT_JOBS);
  const jobCount = configuredJobCount ?? getDefaultJobCount();

  if (!fs.existsSync(ESLINT_BIN)) {
    process.stderr.write(
      `Could not find ESLint at ${ESLINT_BIN}. Ensure dependencies are installed (yarn install).\n`,
    );
    process.exit(1);
  }

  const eslintArgsBase = [
    ...(fix ? ['--fix'] : []),
    '--cache',
    '--cache-location',
    CACHE_LOCATION,
  ];

  const projectFiles = new Set<string>();
  for (const project of TYPE_SCRIPT_PROJECTS) {
    for (const fileName of getProjectLintFileNames(project.configPath)) {
      projectFiles.add(fileName);
    }
  }

  const jsAndSnapFiles = getGitFileNames()
    .filter(
      (fileName) =>
        JS_AND_SNAP_FILE_REGEX.test(fileName) && !projectFiles.has(fileName),
    )
    .sort();

  const projectFileNames = [...projectFiles].sort();
  const filesToLint = [...projectFileNames, ...jsAndSnapFiles];
  const eslintArgsWithDelimiter = [...eslintArgsBase, '--'];
  const baseCommandLength =
    process.execPath.length +
    ESLINT_BIN.length +
    eslintArgsWithDelimiter.join(' ').length +
    3;
  const fileChunks = chunkByApproxCommandLength(filesToLint, baseCommandLength);

  const combinedResults: unknown[] = [];
  let worstEslintExitCode = 0;
  const chunkResults = await runChunkPool(
    fileChunks,
    eslintArgsWithDelimiter,
    jobCount,
  );

  for (const { eslintExitCode, lintResults, stderr } of chunkResults) {
    combinedResults.push(...lintResults);
    if (stderr) {
      process.stderr.write(stderr);
    }

    if (eslintExitCode > worstEslintExitCode) {
      worstEslintExitCode = eslintExitCode;
    }
  }

  const filteredResults = combinedResults.filter(
    (lintResult) => !isIgnoredFileWarningResult(lintResult),
  );

  const loadedFormatter = await new ESLint().loadFormatter('stylish');
  const output = loadedFormatter.format(filteredResults);
  if (output) {
    process.stdout.write(output);
  }

  process.exit(worstEslintExitCode);
}

main().catch((error) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exit(2);
});
