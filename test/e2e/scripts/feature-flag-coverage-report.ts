/**
 * Feature Flag Test Coverage Report
 *
 * Scans E2E test files for references to feature flags from the registry
 * and generates a coverage report showing which flags have explicit test
 * coverage vs. which are only tested via default mock values.
 *
 * Usage:
 *   yarn feature-flag:coverage
 *
 * Output:
 *   - Console table with per-flag coverage details
 *   - JSON report at test/e2e/scripts/feature-flag-coverage-report.json
 */

import * as fs from 'fs';
import * as path from 'path';

import type { Json } from '@metamask/utils';

import { FEATURE_FLAG_REGISTRY, FeatureFlagStatus } from '../feature-flags';

// ============================================================================
// Types
// ============================================================================

type CoverageLevel = 'full' | 'partial' | 'default-only';

type FlagReference = {
  file: string;
  values: string[];
};

type FlagCoverageEntry = {
  flag: string;
  type: string;
  status: string;
  inProd: boolean;
  productionDefault: string;
  coverage: CoverageLevel;
  testedStates: { true: boolean; false: boolean };
  references: FlagReference[];
};

type CoverageReport = {
  generatedAt: string;
  summary: {
    totalFlags: number;
    activeFlags: number;
    fullCoverage: number;
    partialCoverage: number;
    defaultOnlyCoverage: number;
    coveragePercentage: number;
  };
  flags: FlagCoverageEntry[];
};

// ============================================================================
// Configuration
// ============================================================================

const SCAN_DIRS = ['test/e2e/tests', 'test/e2e/benchmarks'];
const SCAN_EXTENSIONS = new Set(['.ts', '.js', '.mts', '.mjs']);
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build']);

// ============================================================================
// File Scanner
// ============================================================================

function collectTestFiles(dir: string): string[] {
  const files: string[] = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectTestFiles(fullPath));
    } else if (
      entry.isFile() &&
      SCAN_EXTENSIONS.has(path.extname(entry.name))
    ) {
      files.push(fullPath);
    }
  }

  return files;
}

// ============================================================================
// Flag Scanner
// ============================================================================

/**
 * Uses word-boundary regex (\b) to avoid substring false positives
 * (e.g. "addBitcoinAccount" matching inside "addBitcoinAccountDummyFlag").
 * \b treats underscores as word chars, which works because flag names in
 * test files appear as object keys where word boundaries naturally occur.
 */
function fileContainsFlag(content: string, flagName: string): boolean {
  const regex = new RegExp(`\\b${escapeRegex(flagName)}\\b`);
  return regex.test(content);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractFlagValues(content: string, flagName: string): string[] {
  const escapedName = escapeRegex(flagName);
  const regex = new RegExp(`\\b${escapedName}\\b\\s*[:=]\\s*`, 'g');
  const values = new Set<string>();
  let match;

  while ((match = regex.exec(content)) !== null) {
    const rest = content.slice(match.index + match[0].length);
    values.add(extractValueSnippet(rest));
  }

  return [...values];
}

function extractValueSnippet(after: string): string {
  const trimmed = after.trimStart();

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return extractBalanced(trimmed);
  }

  const untilEnd = trimmed.match(/^[^,\n}]+/);
  const raw = untilEnd ? untilEnd[0].trim() : trimmed.split('\n')[0].trim();
  return truncate(raw);
}

function extractBalanced(str: string): string {
  const open = str[0];
  const close = open === '{' ? '}' : ']';
  let depth = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === open) depth++;
    else if (str[i] === close) depth--;
    if (depth === 0) {
      const value = str
        .slice(0, i + 1)
        .replace(/\s+/g, ' ')
        .trim();
      return truncate(value);
    }
  }
  return truncate(str.split('\n')[0].trim());
}

function truncate(str: string, max = 80): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 3) + '...';
}

function summarizeDefault(value: Json): string {
  const str = JSON.stringify(value);
  if (str.length <= 50) {
    return str;
  }
  return str.slice(0, 47) + '...';
}

// ============================================================================
// State Detection
// ============================================================================

function resolveEnabledState(value: Json): boolean | null {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const obj = value as Record<string, Json>;
    if (typeof obj.enabled === 'boolean') {
      return obj.enabled;
    }
  }
  return null;
}

const TRUTHY_PATTERNS = [/\btrue\b/, /enabled:\s*true/];
const FALSY_PATTERNS = [/\bfalse\b/, /enabled:\s*false/];

function extractTestedStates(
  references: FlagReference[],
  productionDefault: Json,
): { true: boolean; false: boolean } {
  const states = { true: false, false: false };

  const defaultState = resolveEnabledState(productionDefault);
  if (defaultState === true) states.true = true;
  if (defaultState === false) states.false = true;

  for (const ref of references) {
    for (const val of ref.values) {
      if (TRUTHY_PATTERNS.some((p) => p.test(val))) states.true = true;
      if (FALSY_PATTERNS.some((p) => p.test(val))) states.false = true;
    }
  }

  return states;
}

function determineCoverage(
  references: FlagReference[],
  testedStates: { true: boolean; false: boolean },
): CoverageLevel {
  if (references.length === 0) return 'default-only';
  if (testedStates.true && testedStates.false) return 'full';
  return 'partial';
}

// ============================================================================
// Report Generation
// ============================================================================

function generateReport(repoRoot: string): CoverageReport {
  const testFiles: string[] = [];
  for (const scanDir of SCAN_DIRS) {
    const absDir = path.join(repoRoot, scanDir);
    testFiles.push(...collectTestFiles(absDir));
  }

  console.log(`Scanning ${testFiles.length} test files...\n`);

  const fileContents = new Map<string, string>();
  for (const filePath of testFiles) {
    fileContents.set(filePath, fs.readFileSync(filePath, 'utf-8'));
  }

  const registryEntries = Object.values(FEATURE_FLAG_REGISTRY);
  const flagResults: FlagCoverageEntry[] = [];

  for (const entry of registryEntries) {
    const references: FlagReference[] = [];

    for (const [filePath, content] of fileContents) {
      if (fileContainsFlag(content, entry.name)) {
        references.push({
          file: path.relative(repoRoot, filePath),
          values: extractFlagValues(content, entry.name),
        });
      }
    }

    const testedStates = extractTestedStates(
      references,
      entry.productionDefault,
    );

    flagResults.push({
      flag: entry.name,
      type: entry.type,
      status: entry.status,
      inProd: entry.inProd,
      productionDefault: summarizeDefault(entry.productionDefault),
      coverage: determineCoverage(references, testedStates),
      testedStates,
      references,
    });
  }

  const coverageOrder: Record<CoverageLevel, number> = {
    full: 0,
    partial: 1,
    'default-only': 2,
  };

  flagResults.sort((a, b) => {
    if (a.coverage !== b.coverage) {
      return coverageOrder[a.coverage] - coverageOrder[b.coverage];
    }
    return a.flag.localeCompare(b.flag);
  });

  const activeFlags = flagResults.filter(
    (f) => f.status === FeatureFlagStatus.Active,
  );
  const fullCount = flagResults.filter((f) => f.coverage === 'full').length;
  const partialCount = flagResults.filter(
    (f) => f.coverage === 'partial',
  ).length;
  const defaultOnlyCount = flagResults.filter(
    (f) => f.coverage === 'default-only',
  ).length;

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalFlags: flagResults.length,
      activeFlags: activeFlags.length,
      fullCoverage: fullCount,
      partialCoverage: partialCount,
      defaultOnlyCoverage: defaultOnlyCount,
      coveragePercentage: Math.round(
        ((fullCount + partialCount) / flagResults.length) * 100,
      ),
    },
    flags: flagResults,
  };
}

// ============================================================================
// Console Output
// ============================================================================

function printReport(report: CoverageReport): void {
  const { summary, flags } = report;

  console.log('='.repeat(80));
  console.log('  FEATURE FLAG TEST COVERAGE REPORT');
  console.log('='.repeat(80));
  console.log(`  Generated: ${report.generatedAt}`);
  console.log('');

  console.log('  SUMMARY');
  console.log('  ' + '-'.repeat(40));
  console.log(`  Total flags:       ${summary.totalFlags}`);
  console.log(`  Active flags:      ${summary.activeFlags}`);
  console.log(`  Full coverage:     ${summary.fullCoverage}`);
  console.log(`  Partial coverage:  ${summary.partialCoverage}`);
  console.log(`  Default-only:      ${summary.defaultOnlyCoverage}`);
  console.log(
    `  Coverage:          ${summary.coveragePercentage}% of flags have explicit tests`,
  );
  console.log('');

  const flagCol = 45;
  const coverageCol = 14;
  const statesCol = 12;
  const filesCol = 6;
  const defaultCol = 50;

  const header = [
    'Flag'.padEnd(flagCol),
    'Coverage'.padEnd(coverageCol),
    'States'.padEnd(statesCol),
    'Files'.padEnd(filesCol),
    'Prod Default'.padEnd(defaultCol),
  ].join(' | ');

  console.log('  ' + header);
  console.log('  ' + '-'.repeat(header.length));

  for (const entry of flags) {
    const coverageLabel = entry.coverage.toUpperCase();
    const statesLabel =
      entry.coverage === 'default-only'
        ? '-'
        : `T:${entry.testedStates.true ? '✓' : '✗'} F:${entry.testedStates.false ? '✓' : '✗'}`;
    const row = [
      entry.flag.padEnd(flagCol),
      coverageLabel.padEnd(coverageCol),
      statesLabel.padEnd(statesCol),
      String(entry.references.length).padEnd(filesCol),
      entry.productionDefault.padEnd(defaultCol),
    ].join(' | ');

    console.log('  ' + row);
  }

  console.log('');

  const fullFlags = flags.filter((f) => f.coverage === 'full');
  if (fullFlags.length > 0) {
    console.log('  FULL COVERAGE (both true and false states tested)');
    console.log('  ' + '-'.repeat(40));
    for (const entry of fullFlags) {
      console.log(
        `  ${entry.flag}  (prod default: ${entry.productionDefault})`,
      );
      for (const ref of entry.references) {
        const valueStr =
          ref.values.length > 0 ? ref.values.join(', ') : '(reference only)';
        console.log(`    ${ref.file}: ${valueStr}`);
      }
    }
    console.log('');
  }

  const partialFlags = flags.filter((f) => f.coverage === 'partial');
  if (partialFlags.length > 0) {
    console.log('  PARTIAL COVERAGE (only one state tested)');
    console.log('  ' + '-'.repeat(40));
    for (const entry of partialFlags) {
      const missing = !entry.testedStates.true ? 'true' : 'false';
      console.log(`  ${entry.flag}  (missing: ${missing} state)`);
      for (const ref of entry.references) {
        const valueStr =
          ref.values.length > 0 ? ref.values.join(', ') : '(reference only)';
        console.log(`    ${ref.file}: ${valueStr}`);
      }
    }
    console.log('');
  }

  const defaultOnly = flags.filter((f) => f.coverage === 'default-only');
  if (defaultOnly.length > 0) {
    console.log('  DEFAULT-ONLY (no explicit test references)');
    console.log('  ' + '-'.repeat(40));
    for (const entry of defaultOnly) {
      console.log(`  - ${entry.flag}`);
    }
    console.log('');
  }

  console.log('='.repeat(80));
}

// ============================================================================
// JSON Output
// ============================================================================

function writeJsonReport(report: CoverageReport, outputPath: string): void {
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2) + '\n', 'utf-8');
  console.log(`JSON report written to: ${outputPath}`);
}

// ============================================================================
// Main
// ============================================================================

function main(): void {
  const scriptDir = __dirname;
  const repoRoot = path.resolve(scriptDir, '..', '..', '..');

  const pkgPath = path.join(repoRoot, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    console.error(`Error: Could not find package.json at ${pkgPath}`);
    console.error(
      'Make sure you are running this from the metamask-extension repo root.',
    );
    process.exit(1);
  }

  const report = generateReport(repoRoot);
  printReport(report);

  const jsonOutputPath = path.join(
    scriptDir,
    'feature-flag-coverage-report.json',
  );
  writeJsonReport(report, jsonOutputPath);
}

main();
