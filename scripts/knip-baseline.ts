#!/usr/bin/env tsx
/**
 * Knip baseline driver for the dead-code check.
 *
 * Gating CI on a greenfield knip report would fail every branch, so this
 * script gates on the DIFF between the current knip report and the committed
 * baseline in `scripts/knip-baseline.jsonc` (same pattern as
 * development/circular-deps.ts + circular-deps.jsonc). See
 * docs/dead-code-check.md for the full workflow.
 *
 * The script lives in `scripts/` (not `development/`), like the mobile
 * counterpart: it is CI tooling driven from package.json scripts, and the
 * Sonar analysis trees (app, development, shared, types, ui) carry the
 * new-code coverage gate that runtime app code is held to.
 *
 * - `yarn knip:check` fails on NEW findings (as GitHub annotations in CI) and
 *   on baselined findings that were fixed but not yet removed from the
 *   baseline via `yarn knip:update`.
 * - `yarn knip:update` rewrites the baseline and refuses to GROW it unless
 *   `--allow-grow` is passed, so a routine update cannot silently whitelist
 *   new dead code.
 * - Baseline entries are `<type>|<file>|<symbol>` keys without line numbers,
 *   so they survive unrelated edits and stay diff-friendly.
 * - Findings that are intentional should be suppressed in knip.config.ts
 *   (entry/ignore/ignoreDependencies) with a reason comment instead.
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const BASELINE_FILE = 'scripts/knip-baseline.jsonc';

/**
 * Known knip issue types in display/baseline order (unknown future types sort
 * after them), with their human-readable labels.
 */
const ISSUE_TYPES: readonly (readonly [type: string, label: string])[] = [
  ['files', 'Unused files'],
  ['dependencies', 'Unused dependencies'],
  ['devDependencies', 'Unused devDependencies'],
  ['unlisted', 'Unlisted dependencies'],
  ['binaries', 'Unused binaries'],
  ['unresolved', 'Unresolved imports'],
  ['exports', 'Unused exports'],
  ['nsExports', 'Unused exports (namespaces)'],
  ['types', 'Unused types'],
  ['nsTypes', 'Unused types (namespaces)'],
  ['duplicates', 'Duplicate exports'],
  ['enumMembers', 'Unused enum members'],
  ['namespaceMembers', 'Unused namespace members'],
  ['subpaths', 'Unused export subpaths'],
  ['optionalPeerDependencies', 'Unused optional peer dependencies'],
  ['catalog', 'Unused catalog entries'],
  ['catalogReferences', 'Unused catalog references'],
  ['cycles', 'Dependency cycles'],
];

const ISSUE_TYPE_ORDER = ISSUE_TYPES.map(([type]) => type);

const ISSUE_LABELS = Object.fromEntries(ISSUE_TYPES);

/** One flagged symbol as emitted by knip's JSON reporter. */
type KnipIssueSymbol = {
  name: string;
  line?: number;
};

/**
 * A knip issue group: all issues found in one file, keyed by issue type. The
 * JSON reporter only emits the issue types that are configured to report.
 */
type KnipIssueGroup = {
  file: string;
  owners?: { name: string }[];
  files?: KnipIssueSymbol[];
  dependencies?: KnipIssueSymbol[];
  unlisted?: KnipIssueSymbol[];
  [issueType: string]: unknown;
};

type NormalizedReport = {
  entries: string[];
  linesByEntry: Map<string, number>;
  ownersByEntry: Map<string, string[]>;
};

type ReportDiff = {
  added: string[];
  removed: string[];
};

// Compares two strings by code point so ordering does not depend on locale.
function compareStrings(a: string, b: string): number {
  if (a === b) {
    return 0;
  }
  return a < b ? -1 : 1;
}

/**
 * Orders baseline entries by issue type (known types first, unknown future
 * types after them), then by code point.
 *
 * @param a - Baseline-format entry.
 * @param b - Baseline-format entry.
 * @returns A negative, zero or positive number, as expected by `Array.sort`.
 */
export function compareEntries(a: string, b: string): number {
  const rank = (entry: string): number => {
    const index = ISSUE_TYPE_ORDER.indexOf(entry.split('|')[0]);
    return index === -1 ? ISSUE_TYPE_ORDER.length : index;
  };
  const byType = rank(a) - rank(b);
  if (byType !== 0) {
    return byType;
  }
  return compareStrings(a, b);
}

/**
 * Normalizes the knip JSON report into baseline entries keyed by
 * `<type>|<file>|<symbol>` (no line numbers), plus lookups for GitHub
 * annotations (line numbers) and the codeowners work-queue view (CODEOWNERS
 * teams). A flagged file is its own symbol; every other issue type is keyed
 * by the file it was found in.
 *
 * @param groups - Issue groups as emitted by the knip JSON reporter.
 * @returns Sorted baseline entries with their optional line numbers and
 * CODEOWNERS teams.
 */
export function normalizeReport(groups: KnipIssueGroup[]): NormalizedReport {
  const entries = new Set<string>();
  const linesByEntry = new Map<string, number>();
  const ownersByEntry = new Map<string, string[]>();

  for (const group of groups) {
    const groupTypes = Object.keys(group).filter(
      (key) => key !== 'file' && key !== 'owners' && Array.isArray(group[key]),
    );

    for (const type of groupTypes) {
      for (const item of group[type] as KnipIssueSymbol[]) {
        if (!item?.name) {
          continue;
        }
        const entry =
          type === 'files'
            ? `${type}|${item.name}`
            : `${type}|${group.file}|${item.name}`;
        entries.add(entry);
        if (typeof item.line === 'number' && !linesByEntry.has(entry)) {
          linesByEntry.set(entry, item.line);
        }
        const owners = (group.owners ?? [])
          .map((owner) => owner.name)
          .filter(Boolean);
        if (owners.length > 0 && !ownersByEntry.has(entry)) {
          ownersByEntry.set(entry, owners);
        }
      }
    }
  }

  return {
    entries: [...entries].sort(compareEntries),
    linesByEntry,
    ownersByEntry,
  };
}

/**
 * Groups baseline-format entries by their CODEOWNERS team (as resolved by
 * knip's JSON reporter); entries without a resolved owner land in the
 * `[no-owner]` bucket. This backs `yarn knip:codeowners` — knip's own
 * `--reporter codeowners` crashes on `files` findings in knip 6.48.
 *
 * @param entries - Sorted baseline-format entries.
 * @param ownersByEntry - Entry to CODEOWNERS-team lookup from the report.
 * @returns Owner names (sorted) to entries, in `compareEntries` order.
 */
export function groupEntriesByOwner(
  entries: string[],
  ownersByEntry: Map<string, string[]>,
): Map<string, string[]> {
  const grouped = new Map<string, string[]>();
  for (const entry of entries) {
    const owners = ownersByEntry.get(entry) ?? ['[no-owner]'];
    const key = owners.join(', ');
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)?.push(entry);
  }
  return new Map(
    [...grouped.entries()]
      .map(([owner, ownerEntries]): [string, string[]] => [
        owner,
        [...ownerEntries].sort(compareEntries),
      ])
      .sort(([ownerA], [ownerB]) => compareStrings(ownerA, ownerB)),
  );
}

/**
 * Diffs the current report against the baseline: `added` entries are new dead
 * code, `removed` entries are fixed dead code still listed in the baseline.
 */
export function diffFindings(actual: string[], baseline: string[]): ReportDiff {
  const baselineSet = new Set(baseline);
  const actualSet = new Set(actual);
  return {
    added: actual.filter((entry) => !baselineSet.has(entry)),
    removed: baseline.filter((entry) => !actualSet.has(entry)),
  };
}

/**
 * Formats one normalized entry for terminal output, e.g.
 * `files|app/foo.ts` → `app/foo.ts` and
 * `unlisted|app/foo.ts|pkg` → `pkg (in app/foo.ts)`.
 */
export function formatEntry(entry: string): string {
  const [, ...rest] = entry.split('|');
  if (rest.length === 1) {
    return rest[0];
  }
  const file = rest.slice(0, -1).join('|');
  const symbol = rest[rest.length - 1];
  return file === 'package.json' ? symbol : `${symbol} (in ${file})`;
}

/**
 * Runs knip with the JSON reporter from the given repository root.
 *
 * @throws When knip fails or emits output that is not valid JSON.
 */
export function runKnip(repoRoot: string): KnipIssueGroup[] {
  const knipBin = path.join(repoRoot, 'node_modules', '.bin', 'knip');
  const result = spawnSync(process.execPath, [knipBin, '--reporter', 'json'], {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
  });

  try {
    const parsed = JSON.parse(result.stdout ?? '') as {
      issues?: KnipIssueGroup[];
    };
    return Array.isArray(parsed.issues) ? parsed.issues : [];
  } catch {
    throw new Error(
      `knip did not produce valid JSON output (exit code ${result.status}).\n${result.stderr ?? ''}`,
    );
  }
}

/**
 * Reads the committed baseline; a missing file is treated as empty so the
 * first `yarn knip:update` can create it.
 */
export function readBaseline(baselinePath: string): string[] {
  if (!fs.existsSync(baselinePath)) {
    return [];
  }
  // The baseline is JSONC: ignore full-line comments (see writeBaseline).
  const fileContents = fs.readFileSync(baselinePath, 'utf8');
  const stripped = fileContents
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n');
  const parsed = JSON.parse(stripped) as { entries?: string[] };
  if (!Array.isArray(parsed.entries)) {
    throw new Error(`Unexpected format in ${baselinePath}`);
  }
  return parsed.entries;
}

/**
 * Writes the baseline file with a fixed shape so diffs stay minimal.
 */
export function writeBaseline(baselinePath: string, entries: string[]): void {
  const header = [
    'Machine-generated by `yarn knip:update` (scripts/knip-baseline.ts); do not edit by hand.',
    'Each entry is "<type>|<file>|<symbol>". New findings fail `yarn knip:check`; shrink this file by fixing the findings and re-running `yarn knip:update`.',
    'Suppress intentional findings in knip.config.ts with a reason comment instead. See docs/dead-code-check.md.',
  ];
  const contents = `${header.map((line) => `// ${line}`).join('\n')}\n\n${JSON.stringify(
    { entries: [...entries].sort(compareEntries) },
    null,
    2,
  )}\n`;
  fs.writeFileSync(baselinePath, contents);
}

/**
 * Prints findings grouped by issue type and emits GitHub error annotations
 * (rendered on the PR when run from GitHub Actions). Narrative output goes to
 * stderr; workflow commands go to stdout, the only stream the runner reliably
 * parses.
 */
export function printFindings(
  entries: string[],
  linesByEntry: Map<string, number>,
): void {
  const grouped = new Map<
    string,
    { entry: string; file: string; symbol: string }[]
  >();
  for (const entry of entries) {
    const [type, ...rest] = entry.split('|');
    if (!grouped.has(type)) {
      grouped.set(type, []);
    }
    const symbol = rest[rest.length - 1];
    const file = type === 'files' ? symbol : rest.slice(0, -1).join('|');
    grouped.get(type)?.push({ entry, file, symbol });
  }

  for (const [type, items] of grouped) {
    console.error(`\n${ISSUE_LABELS[type] ?? type} (${items.length}):`);
    for (const { entry, file, symbol } of items) {
      console.error(`  ${symbol}${file === symbol ? '' : ` (in ${file})`}`);
      const line = linesByEntry.get(entry);
      if (process.env.GITHUB_ACTIONS === 'true') {
        const lineSuffix = line ? `,line=${line}` : '';
        process.stdout.write(
          `::error file=${file}${lineSuffix},title=Knip: ${ISSUE_LABELS[type] ?? type}::${symbol}\n`,
        );
      }
    }
  }
}

/**
 * Counts findings with a pluralized noun, e.g. `2 findings` / `1 finding`.
 *
 * @param count - Number of findings.
 * @param noun - Singular noun.
 * @returns Count and noun, pluralized when needed.
 */
const countFindings = (count: number, noun: string): string =>
  `${count} ${noun}${count === 1 ? '' : 's'}`;

/**
 * Compares the current knip report against the baseline and exits non-zero on
 * any difference in either direction.
 */
function check(repoRoot: string): void {
  const { entries: actual, linesByEntry } = normalizeReport(runKnip(repoRoot));
  const baseline = readBaseline(path.join(repoRoot, BASELINE_FILE));
  const { added, removed } = diffFindings(actual, baseline);

  if (added.length === 0 && removed.length === 0) {
    console.log(
      `knip:check passed — ${countFindings(actual.length, 'known finding')} match the baseline.`,
    );
    return;
  }

  if (added.length > 0) {
    console.error(
      `\n${countFindings(added.length, 'new dead-code finding')} (not in ${BASELINE_FILE}):`,
    );
    printFindings(added, linesByEntry);
    console.error(
      '\nFix the finding(s) (preferred), or suppress intentional cases in knip.config.ts (with a reason comment).\n' +
        'Only if growing the baseline is genuinely intended, run `yarn knip:update --allow-grow` and commit the change.',
    );
  }

  if (removed.length > 0) {
    console.error(
      `\n${countFindings(removed.length, 'baselined finding')} no longer reported (thank you for fixing them!):`,
    );
    for (const entry of removed) {
      console.error(`  ${formatEntry(entry)}`);
    }
    console.error(
      `\nThe baseline must be shrunk to stay in sync: run \`yarn knip:update\` and commit the change.`,
    );
  }

  process.exit(1);
}

/**
 * Regenerates the baseline from the current knip report; refuses to grow it
 * unless explicitly allowed.
 */
function update(repoRoot: string, allowGrow: boolean): void {
  const baselinePath = path.join(repoRoot, BASELINE_FILE);
  const { entries: actual } = normalizeReport(runKnip(repoRoot));
  const baseline = readBaseline(baselinePath);
  const { added, removed } = diffFindings(actual, baseline);

  if (added.length > 0 && !allowGrow) {
    console.error(
      `\nRefusing to grow ${BASELINE_FILE} with ${countFindings(added.length, 'new finding')}:`,
    );
    for (const entry of added) {
      console.error(`  ${formatEntry(entry)}`);
    }
    console.error(
      '\nFix the finding(s), or suppress intentional cases in knip.config.ts (with a reason comment).',
      'Only if the growth is genuinely intended, re-run with: yarn knip:update --allow-grow',
    );
    process.exit(1);
  }

  writeBaseline(baselinePath, actual);
  console.log(
    `Wrote ${countFindings(actual.length, 'finding')} to ${BASELINE_FILE} (${added.length} added, ${removed.length} removed).`,
  );
}

/**
 * Prints the current knip report grouped by CODEOWNERS team — the work-queue
 * view used to hand findings to the owning teams.
 */
function codeowners(repoRoot: string): void {
  const { entries, ownersByEntry } = normalizeReport(runKnip(repoRoot));

  if (entries.length === 0) {
    console.log('knip:codeowners — no findings, the work queue is empty.');
    return;
  }

  const grouped = groupEntriesByOwner(entries, ownersByEntry);
  for (const [owner, ownerEntries] of grouped) {
    console.log(`\n${owner} (${ownerEntries.length}):`);
    for (const entry of ownerEntries) {
      console.log(`  ${formatEntry(entry)}`);
    }
  }
  console.log(`\n${countFindings(entries.length, 'finding')} in total.`);
}

/** CLI entry point. */
function main(argv: string[]): void {
  const command = argv[0];
  const allowGrow = argv.includes('--allow-grow');
  const repoRoot = path.resolve(__dirname, '..');

  if (command === 'check') {
    check(repoRoot);
  } else if (command === 'update') {
    update(repoRoot, allowGrow);
  } else if (command === 'codeowners') {
    codeowners(repoRoot);
  } else {
    console.error(
      'Usage: tsx scripts/knip-baseline.ts [check|update|codeowners] [--allow-grow]',
    );
    process.exit(1);
  }
}

if (require.main === module) {
  main(process.argv.slice(2));
}
