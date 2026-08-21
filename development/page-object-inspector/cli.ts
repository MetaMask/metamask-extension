import fs from 'node:fs';
import path from 'node:path';
import { HELP_TEXT, parseCliArgs, type CliOptions } from './args';
import { buildIndex, toRuntimeIndex, type SourceFile } from './build-index';
import {
  filterOverlaps,
  filterUnresolved,
  formatIndexReport,
  formatJson,
  formatOverlapReport,
  shouldFail,
  countByClassification,
  countKinds,
} from './report';

const REPO_ROOT = path.resolve(__dirname, '../..');
const PAGE_OBJECTS_ROOT = path.join(REPO_ROOT, 'test/e2e/page-objects');
const OUTPUT_PATH = path.join(
  REPO_ROOT,
  'development/page-object-inspector/.generated/index.json',
);
/**
 * The browser overlay imports this through webpack, so it has to exist in a
 * fresh checkout. It is committed, and deliberately carries no timestamp so
 * that regenerating it produces no diff unless a page object actually changed.
 *
 * It lives beside the overlay rather than here because `ui/` is not allowed to
 * import from `development/`.
 */
const RUNTIME_OUTPUT_PATH = path.join(
  REPO_ROOT,
  'ui/dev/page-object-inspector/runtime-index.json',
);

/**
 * Reads every page-object source file from disk.
 *
 * @returns The source files, sorted by path for stable output.
 */
function readPageObjectFiles(): SourceFile[] {
  return fs
    .readdirSync(PAGE_OBJECTS_ROOT, { recursive: true, encoding: 'utf8' })
    .filter((entry) => entry.endsWith('.ts') && !entry.endsWith('.test.ts'))
    .sort()
    .map((entry) => ({
      relativePath: entry.split(path.sep).join('/'),
      sourceText: fs.readFileSync(path.join(PAGE_OBJECTS_ROOT, entry), 'utf8'),
    }));
}

/**
 * Writes the generated index artifacts used by the overlay and later reports.
 *
 * @param index - The built page-object index.
 * @returns Repo-relative paths of the files that were written.
 */
function writeIndexArtifacts(
  index: ReturnType<typeof buildIndex>,
): string[] {
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(
    OUTPUT_PATH,
    `${JSON.stringify({ generatedAt: new Date().toISOString(), ...index }, null, 2)}\n`,
  );
  fs.writeFileSync(
    RUNTIME_OUTPUT_PATH,
    `${JSON.stringify(toRuntimeIndex(index), null, 2)}\n`,
  );
  return [
    path.relative(REPO_ROOT, OUTPUT_PATH),
    path.relative(REPO_ROOT, RUNTIME_OUTPUT_PATH),
  ];
}

/**
 * Runs the page-object inspector CLI.
 *
 * @param argv - Arguments after the script name.
 * @returns The process exit code.
 */
export function run(argv: string[]): number {
  const parsed = parseCliArgs(argv);

  if (parsed.kind === 'help') {
    console.log(HELP_TEXT);
    return 0;
  }

  if (parsed.kind === 'error') {
    console.error(parsed.message);
    console.error('');
    console.error(HELP_TEXT);
    return 2;
  }

  return runCommand(parsed.options);
}

/**
 * Builds the index and prints the requested report.
 *
 * @param options - Parsed CLI options.
 * @returns The process exit code.
 */
function runCommand(options: CliOptions): number {
  const index = buildIndex({ files: readPageObjectFiles() });
  const overlaps = filterOverlaps(index.overlaps, options);
  const unresolved = filterUnresolved(index.unresolved, options);
  const wrote =
    options.command === 'index' ? writeIndexArtifacts(index) : [];

  if (options.json) {
    console.log(
      formatJson({
        command: options.command,
        summary: index.summary,
        overlapCounts: countByClassification(overlaps),
        kinds: countKinds(index),
        overlaps,
        unresolved,
        ...(wrote.length > 0 ? { wrote } : {}),
      }).trimEnd(),
    );
  } else if (options.command === 'overlaps') {
    console.log(
      formatOverlapReport({
        overlaps,
        color: options.color,
        limit: options.limit,
      }).join('\n'),
    );
  } else {
    console.log(
      formatIndexReport({
        index,
        overlaps,
        unresolved,
        wrote,
        color: options.color,
        limit: options.limit,
      }).join('\n'),
    );
  }

  return shouldFail(overlaps, options) ? 1 : 0;
}

const exitCode = run(process.argv.slice(2));
if (exitCode !== 0) {
  process.exit(exitCode);
}
