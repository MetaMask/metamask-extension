import { readFileSync } from 'fs';
import process from 'process';
import { spawnSync } from 'child_process';

type Mode = 'staged' | 'files';

type CommandResult = {
  status: number;
  stdout: string;
  stderr: string;
};

const CODE_FILE_REGEX = /\.(ts|tsx|js|jsx)$/u;
const TEST_FILE_REGEX = /\.(test|spec)\.(ts|tsx|js|jsx)$/u;
const VALID_FLAG_KEY_REGEX =
  /^[a-z][A-Za-z0-9]*[A-Z]{2,}[0-9]+Abtest[A-Z][A-Za-z0-9]*$/u;
const ABTEST_STRING_LITERAL_REGEX = /(['"])([A-Za-z0-9]*Abtest[A-Za-z0-9]*)\1/gu;
const RISKY_CHANGE_REGEX =
  /useABTest\(|active_ab_tests\s*:|ab_tests\s*:|trackEvent\(|createEventBuilder\(|MetaMetricsEvents\.|Experiment Viewed|ExperimentViewed/u;

function usage(): string {
  return `Usage:
  check-ab-testing-compliance.ts -h | --help
  check-ab-testing-compliance.ts --staged
  check-ab-testing-compliance.ts --files <file1,file2,...> [--base <git-ref>]

Checks changed files for A/B testing implementation compliance.

Rules:
  - Fail: New ab_tests payload additions in checked code diffs
  - Fail: Malformed literal active_ab_tests objects missing key/value
  - Fail: Inline useABTest variants object missing control
  - Warn: Flag key naming mismatch for Abtest keys
  - Warn: Risky A/B integration changes without test-file updates`;
}

function failWithUsage(message: string): never {
  console.error(message);
  console.error(usage());
  process.exit(2);
}

function runCommand(command: string, args: string[]): CommandResult {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

function runGit(args: string[]): CommandResult {
  return runCommand('git', args);
}

function splitUniqueLines(...texts: string[]): string[] {
  const seen = new Set<string>();

  return texts
    .flatMap((text) => text.split('\n'))
    .map((line) => line.trim())
    .filter((line) => {
      if (!line || seen.has(line)) {
        return false;
      }

      seen.add(line);
      return true;
    });
}

function trim(value: string): string {
  return value.trim();
}

function isCodeFile(file: string): boolean {
  return CODE_FILE_REGEX.test(file);
}

function isTestFile(file: string): boolean {
  return TEST_FILE_REGEX.test(file) || file.includes('/__tests__/');
}

function isValidFlagKey(key: string): boolean {
  return VALID_FLAG_KEY_REGEX.test(key);
}

function refExists(ref: string): boolean {
  return runGit(['rev-parse', '--verify', ref]).status === 0;
}

function isTracked(file: string): boolean {
  return runGit(['ls-files', '--error-unmatch', file]).status === 0;
}

function existsInHead(file: string): boolean {
  return runGit(['cat-file', '-e', `HEAD:${file}`]).status === 0;
}

function collectStagedFiles(): string[] {
  return splitUniqueLines(
    runGit(['diff', '--cached', '--name-only', '--diff-filter=ACMR']).stdout,
  );
}

function collectWorktreeFiles(): string[] {
  return splitUniqueLines(
    runGit(['diff', '--name-only', '--diff-filter=ACMR']).stdout,
    runGit(['ls-files', '--others', '--exclude-standard']).stdout,
  );
}

function collectExplicitFiles(filesArg: string): string[] {
  return splitUniqueLines(...filesArg.split(',').map(trim));
}

function extractAddedLinesFromDiff(diff: string): string[] {
  return diff
    .split('\n')
    .filter((line) => line.startsWith('+') && !line.startsWith('+++ '))
    .map((line) => line.slice(1));
}

function getAddedLines(
  file: string,
  mode: Mode,
  fallbackToWorktree: boolean,
  baseRef: string,
): string[] {
  if (mode === 'staged') {
    if (fallbackToWorktree) {
      if (!isTracked(file)) {
        return readFileSync(file, 'utf8').split('\n');
      }

      return extractAddedLinesFromDiff(
        runGit(['diff', '--unified=0', '--', file]).stdout,
      );
    }

    return extractAddedLinesFromDiff(
      runGit(['diff', '--cached', '--unified=0', '--', file]).stdout,
    );
  }

  if (!existsInHead(file)) {
    return readFileSync(file, 'utf8').split('\n');
  }

  if (baseRef && refExists(baseRef)) {
    return extractAddedLinesFromDiff(
      runGit(['diff', '--unified=0', `${baseRef}...HEAD`, '--', file]).stdout,
    );
  }

  if (isTracked(file)) {
    return extractAddedLinesFromDiff(
      runGit(['diff', '--unified=0', 'HEAD', '--', file]).stdout,
    );
  }

  return [];
}

function countOccurrences(segment: string, char: '(' | ')'): number {
  return Array.from(segment).filter((current) => current === char).length;
}

function dedupe(items: string[]): string[] {
  return Array.from(new Set(items));
}

function printList(title: string, items: string[]): void {
  if (items.length === 0) {
    return;
  }

  console.log('');
  console.log(title);
  for (const item of dedupe(items)) {
    console.log(`- ${item}`);
  }
}

function main(): void {
  let mode: Mode | null = null;
  let filesArg = '';
  let baseRef = '';

  const args = process.argv.slice(2);

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--staged') {
      if (mode) {
        failWithUsage('ERROR: Choose exactly one mode: --staged or --files.');
      }
      mode = 'staged';
      continue;
    }

    if (arg === '--files') {
      if (mode) {
        failWithUsage('ERROR: Choose exactly one mode: --staged or --files.');
      }
      mode = 'files';
      filesArg = args[index + 1] ?? '';
      if (!filesArg) {
        console.error('ERROR: --files requires a comma-separated value.');
        process.exit(2);
      }
      index += 1;
      continue;
    }

    if (arg === '--base') {
      baseRef = args[index + 1] ?? '';
      if (!baseRef) {
        console.error(
          'ERROR: --base requires a git ref (for example origin/main).',
        );
        process.exit(2);
      }
      index += 1;
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      console.log(usage());
      process.exit(0);
    }

    failWithUsage(`ERROR: Unknown argument: ${arg}`);
  }

  if (!mode) {
    failWithUsage('ERROR: Choose exactly one mode: --staged or --files.');
  }

  if (mode === 'files' && !baseRef) {
    for (const candidate of ['origin/main', 'main', 'HEAD~1']) {
      if (refExists(candidate)) {
        baseRef = candidate;
        break;
      }
    }
  }

  let fallbackToWorktree = false;
  let fallbackNote = '';

  let changedFiles =
    mode === 'staged' ? collectStagedFiles() : collectExplicitFiles(filesArg);

  if (mode === 'staged' && changedFiles.length === 0) {
    fallbackToWorktree = true;
    fallbackNote =
      'Info: no staged files found; falling back to working-tree changed files.';
    changedFiles = collectWorktreeFiles();
  }

  if (changedFiles.length === 0) {
    if (mode === 'staged') {
      console.log(
        'A/B compliance check: no staged files and no working-tree changed files to inspect.',
      );
    } else {
      console.log('A/B compliance check: no files to inspect from --files input.');
    }
    process.exit(0);
  }

  const failures: string[] = [];
  const warnings: string[] = [];
  const abRiskyChangeFiles = new Set<string>();
  let testChanged = false;

  for (const file of changedFiles) {
    if (isTestFile(file)) {
      testChanged = true;
      continue;
    }

    if (!isCodeFile(file)) {
      continue;
    }

    const addedLines = getAddedLines(file, mode, fallbackToWorktree, baseRef);
    if (addedLines.length === 0) {
      continue;
    }

    const addedText = addedLines.join('\n');

    if (RISKY_CHANGE_REGEX.test(addedText)) {
      abRiskyChangeFiles.add(file);
    }

    for (let index = 0; index < addedLines.length; index += 1) {
      const line = addedLines[index];

      if (
        /(^|[^A-Za-z0-9_])ab_tests\s*:/.test(line) &&
        !line.includes('LEGACY_AB_TEST_ALLOWED')
      ) {
        failures.push(
          `${file}: added 'ab_tests' payload. New ab_tests payloads are forbidden.`,
        );
      }

      if (/active_ab_tests\s*:/.test(line)) {
        if (/active_ab_tests\s*:\s*(\[|\{)/.test(line)) {
          const window = addedLines.slice(index, index + 9).join('\n');
          if (!/key\s*:/.test(window) || !/value\s*:/.test(window)) {
            failures.push(
              `${file}: malformed literal active_ab_tests object (expected key and value).`,
            );
          }
        }
      }

      if (/useABTest\s*\(/.test(line)) {
        const callSegments: string[] = [];
        let parenDepth = 0;

        for (let segmentIndex = index; segmentIndex < addedLines.length; segmentIndex += 1) {
          let segment = addedLines[segmentIndex];
          if (segmentIndex === index) {
            segment = `useABTest${segment.split('useABTest').slice(1).join('useABTest')}`;
          }

          callSegments.push(segment);
          parenDepth += countOccurrences(segment, '(');
          parenDepth -= countOccurrences(segment, ')');

          if (parenDepth <= 0) {
            break;
          }
        }

        const callWindow = callSegments.join('\n');
        const normalizedCall = callWindow.replace(/\n/g, ' ');
        if (
          /useABTest\s*\([^,]+,\s*\{/.test(normalizedCall) &&
          !/control\s*:/.test(callWindow)
        ) {
          failures.push(
            `${file}: inline useABTest variants object is missing control.`,
          );
        }
      }

      const useAbTestLiteralKey = line.match(
        /useABTest\s*\(\s*['"]([^'"]+)['"]/u,
      )?.[1];

      if (
        useAbTestLiteralKey &&
        !isValidFlagKey(useAbTestLiteralKey)
      ) {
        warnings.push(
          `${file}: flag key '${useAbTestLiteralKey}' does not match {team}{TICKET}Abtest{Name}.`,
        );
      }

      for (const match of line.matchAll(ABTEST_STRING_LITERAL_REGEX)) {
        const key = match[2];
        if (key === useAbTestLiteralKey) {
          continue;
        }

        if (!isValidFlagKey(key)) {
          warnings.push(
            `${file}: Abtest key '${key}' does not match {team}{TICKET}Abtest{Name}.`,
          );
        }
      }
    }
  }

  if (abRiskyChangeFiles.size > 0 && !testChanged) {
    warnings.push(
      'Risky A/B integration changes were detected without any test-file updates. For copy/config-only changes, document rationale in your response.',
    );
  }

  console.log('A/B compliance check summary');
  console.log(`Mode: ${mode}`);
  if (fallbackNote) {
    console.log(fallbackNote);
  }
  if (mode === 'files' && baseRef) {
    console.log(`Base ref: ${baseRef}`);
  }
  console.log(`Files inspected: ${changedFiles.length}`);

  printList('Failures:', failures);
  printList('Warnings:', warnings);

  process.exit(failures.length > 0 ? 1 : 0);
}

main();
