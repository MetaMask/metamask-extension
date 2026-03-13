import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import eslint from 'eslint';
import ts from 'typescript';

const CACHE_LOCATION = path.join(
  'node_modules',
  '.cache',
  'eslint',
  '.eslint-cache',
);
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
const JS_AND_SNAP_FILE_REGEX = /\.(?:js|snap)$/u;
const PROJECT_FILE_REGEX = /\.[cm]?[jt]sx?$/u;

type EslintRunResult = {
  eslintExitCode: number;
  lintResults: eslint.ESLint.LintResult[];
  stderr: string;
};

type EslintChunkResult = EslintRunResult & {
  chunkIndex: number;
};

export function isIgnoredFileWarningResult(lintResult: unknown): boolean {
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

export function normalizePath(filePath: string): string {
  return filePath.replaceAll('\\', '/');
}

export function getDefaultJobCount(): number {
  if (process.env.CI === 'true') {
    return 1;
  }

  const cpuCount =
    typeof os.availableParallelism === 'function'
      ? os.availableParallelism()
      : os.cpus().length;

  return Math.max(1, cpuCount - 1);
}

export function parseJobCount(value: string | undefined): number | null {
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

export function getGitBinaryPath(): string {
  const envGitBinaryPath = process.env.GIT_BINARY_PATH;
  if (envGitBinaryPath) {
    if (!path.isAbsolute(envGitBinaryPath)) {
      throw new Error(
        `GIT_BINARY_PATH must be an absolute path. Received: ${envGitBinaryPath}`,
      );
    }

    if (!fs.existsSync(envGitBinaryPath)) {
      throw new Error(`GIT_BINARY_PATH does not exist: ${envGitBinaryPath}`);
    }

    return envGitBinaryPath;
  }

  const candidates: string[] =
    process.platform === 'win32'
      ? [
          path.join(
            process.env['ProgramFiles'] ?? 'C:\\Program Files',
            'Git',
            'cmd',
            'git.exe',
          ),
          path.join(
            process.env['ProgramFiles(x86)'] ?? 'C:\\Program Files (x86)',
            'Git',
            'cmd',
            'git.exe',
          ),
          path.join(
            process.env['LOCALAPPDATA'] ?? '',
            'Programs',
            'Git',
            'cmd',
            'git.exe',
          ),
        ]
      : [
          '/usr/bin/git',
          '/bin/git',
          '/usr/local/bin/git',
          '/opt/homebrew/bin/git',
        ];

  const found = candidates.find(
    (candidate) => candidate && fs.existsSync(candidate),
  );
  if (!found) {
    throw new Error(
      'Could not locate a Git binary in a standard location. Set GIT_BINARY_PATH to an absolute path to git.',
    );
  }

  return found;
}

function runGit(args: string[]): string {
  const result = spawnSync(getGitBinaryPath(), args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (result.status !== 0) {
    const stderr = result.stderr.trim();
    throw new Error(
      stderr
        ? `git ${args.join(' ')} failed: ${stderr}`
        : `git ${args.join(' ')} failed`,
    );
  }

  return result.stdout;
}

export function getGitFileNames(): string[] {
  return runGit(['ls-files', '--cached', '--others', '--exclude-standard'])
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(normalizePath);
}

function runEslint(args: string[]): Promise<EslintRunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [ESLINT_BIN, '--format', 'json', ...args],
      {
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );

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
      let lintResults: eslint.ESLint.LintResult[] = [];

      if (trimmedStdout) {
        try {
          lintResults = JSON.parse(trimmedStdout) as eslint.ESLint.LintResult[];
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
    throw new Error(
      ts.flattenDiagnosticMessageText(readResult.error.messageText, '\n'),
    );
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

export function chunkByApproxCommandLength(
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

type RunEslintFn = (args: string[]) => Promise<EslintRunResult>;

export async function runChunkPool(
  fileChunks: string[][],
  eslintArgsWithDelimiter: string[],
  jobs: number,
  runEslintFn: RunEslintFn = runEslint,
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
        const chunkResult = await runEslintFn([
          ...eslintArgsWithDelimiter,
          ...fileChunks[chunkIndex],
        ]);

        results.push({
          chunkIndex,
          ...chunkResult,
        });
      } catch (error) {
        failedError = error instanceof Error ? error : new Error(String(error));
        return;
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(jobs, fileChunks.length) }, () =>
      runWorker(),
    ),
  );

  if (failedError) {
    throw failedError;
  }

  return results.sort((a, b) => a.chunkIndex - b.chunkIndex);
}

export async function lintEslint({
  fix,
  jobCount,
  eslintClass = eslint.ESLint,
  runEslintFn = runEslint,
  getProjectLintFileNamesFn = getProjectLintFileNames,
  getGitFileNamesFn = getGitFileNames,
}: {
  fix: boolean;
  jobCount: number;
  eslintClass?: typeof eslint.ESLint;
  runEslintFn?: RunEslintFn;
  getProjectLintFileNamesFn?: (configPath: string) => string[];
  getGitFileNamesFn?: () => string[];
}): Promise<{ exitCode: number; output: string; stderr: string }> {
  if (!fs.existsSync(ESLINT_BIN)) {
    return {
      exitCode: 1,
      output: '',
      stderr: `Could not find ESLint at ${ESLINT_BIN}. Ensure dependencies are installed (yarn install).\n`,
    };
  }

  const eslintArgsBase = [
    ...(fix ? ['--fix'] : []),
    '--cache',
    '--cache-location',
    CACHE_LOCATION,
  ];

  const projectFiles = new Set<string>();
  for (const project of TYPE_SCRIPT_PROJECTS) {
    for (const fileName of getProjectLintFileNamesFn(project.configPath)) {
      projectFiles.add(fileName);
    }
  }

  const jsAndSnapFiles = getGitFileNamesFn()
    .filter(
      (fileName) =>
        JS_AND_SNAP_FILE_REGEX.test(fileName) && !projectFiles.has(fileName),
    )
    .sort((a, b) => a.localeCompare(b));

  const projectFileNames = [...projectFiles].sort((a, b) => a.localeCompare(b));
  const filesToLint = [...projectFileNames, ...jsAndSnapFiles];
  const eslintArgsWithDelimiter = [...eslintArgsBase, '--'];
  const baseCommandLength =
    process.execPath.length +
    ESLINT_BIN.length +
    eslintArgsWithDelimiter.join(' ').length +
    3;
  const fileChunks = chunkByApproxCommandLength(filesToLint, baseCommandLength);

  const combinedResults: eslint.ESLint.LintResult[] = [];
  let worstEslintExitCode = 0;
  const chunkResults = await runChunkPool(
    fileChunks,
    eslintArgsWithDelimiter,
    jobCount,
    runEslintFn,
  );

  for (const { eslintExitCode, lintResults } of chunkResults) {
    combinedResults.push(...lintResults);
    if (eslintExitCode > worstEslintExitCode) {
      worstEslintExitCode = eslintExitCode;
    }
  }

  const filteredResults = combinedResults.filter(
    (lintResult) => !isIgnoredFileWarningResult(lintResult),
  );

  const loadedFormatter = await new eslintClass().loadFormatter('stylish');
  const output = loadedFormatter.format(filteredResults);

  return {
    exitCode: worstEslintExitCode,
    output: output ? output.toString() : '',
    stderr: chunkResults
      .map((r) => r.stderr)
      .filter(Boolean)
      .join(''),
  };
}

async function main(): Promise<void> {
  const fix = process.argv.includes('--fix');
  const configuredJobCount = parseJobCount(process.env.LINT_ESLINT_JOBS);
  const jobCount = configuredJobCount ?? getDefaultJobCount();
  const result = await lintEslint({
    fix,
    jobCount,
  });

  if (result.stderr) {
    process.stderr.write(result.stderr);
  }
  if (result.output) {
    process.stdout.write(result.output);
  }

  process.exit(result.exitCode);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exit(2);
  });
}
