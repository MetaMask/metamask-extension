/**
 * Local counterpart of the CI audit pipeline.  Runs `yarn audit`, downloads
 * the baseline from CloudFront, and diffs to show only NEW advisories
 * introduced by your changes — matching CI behavior.
 *
 * Usage:
 *   yarn audit
 */

import { spawnSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import {
  AUDIT_BASELINE_FILE,
  AUDIT_CURRENT_FILE,
  BLOCKING_SEVERITIES,
  type ParsedAdvisory,
} from './shared/audit-utils.mts';

const BASELINE_URL =
  'https://diuv6g5fj9pvx.cloudfront.net/metamask-extension/audit-baseline';

/**
 * Run `yarn npm audit` in pretty (non-JSON) mode and return the colored
 * terminal output exactly as yarn renders it.
 */
function captureNativeAudit(): string {
  const cmd =
    'yarn npm audit --recursive --environment production --severity moderate';
  const result = spawnSync(cmd, {
    encoding: 'utf8',
    shell: true,
    env: { ...process.env, FORCE_COLOR: '1' },
  });
  return `${result.stdout ?? ''}${result.stderr ?? ''}`;
}

async function main() {
  mkdirSync('.tmp', { recursive: true });

  // -----------------------------------------------------------------------
  // Step 1 — Download baseline from CloudFront
  // -----------------------------------------------------------------------
  console.log('Downloading baseline from main…\n');
  let baseline: ParsedAdvisory[] | null = null;
  try {
    const response = await fetch(BASELINE_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const text = await response.text();
    const parsed = JSON.parse(text) as unknown;
    if (!Array.isArray(parsed)) {
      throw new Error('Baseline is not a JSON array');
    }
    baseline = parsed as ParsedAdvisory[];
    writeFileSync(
      AUDIT_BASELINE_FILE,
      JSON.stringify(baseline, null, 2),
      'utf8',
    );
  } catch (error) {
    console.log(`Could not download baseline: ${error}\n`);
  }

  // -----------------------------------------------------------------------
  // No baseline — just run `yarn npm audit` natively (single audit run)
  // -----------------------------------------------------------------------
  if (!baseline) {
    console.log('No baseline available — falling back to absolute audit.\n');
    const nativeOutput = captureNativeAudit();
    if (nativeOutput.trim()) {
      process.stdout.write(nativeOutput);
      process.exitCode = 1;
    } else {
      console.log(
        'yarn audit: passed — no production vulnerabilities at moderate or higher severity.',
      );
    }
    return;
  }

  // -----------------------------------------------------------------------
  // Step 2 — Run the triage script to produce .tmp/audit-current.json
  // (only needed when we have a baseline to diff against)
  // -----------------------------------------------------------------------
  console.log('Running yarn audit…\n');
  spawnSync('yarn tsx .github/scripts/yarn-audit-and-triage.mts', {
    stdio: ['inherit', 'pipe', 'inherit'],
    shell: true,
    env: {
      ...process.env,
      CHECK_DEPRECATIONS: 'false',
      CREATE_TRACKING_ISSUE: 'false',
      SLACK_HIGHLIGHT: 'false',
    },
  });

  if (!existsSync(AUDIT_CURRENT_FILE)) {
    console.error(
      `Audit failed — ${AUDIT_CURRENT_FILE} was not created. Check stderr above.`,
    );
    process.exitCode = 1;
    return;
  }

  let current: ParsedAdvisory[];
  try {
    current = JSON.parse(readFileSync(AUDIT_CURRENT_FILE, 'utf8'));
    if (!Array.isArray(current)) {
      throw new Error('Not an array');
    }
  } catch {
    console.error(`Failed to parse ${AUDIT_CURRENT_FILE}.`);
    process.exitCode = 1;
    return;
  }

  // -----------------------------------------------------------------------
  // Step 3 — Diff: new advisories at moderate+ severity (by GHSA ID)
  // -----------------------------------------------------------------------
  const baselineIds = new Set(
    baseline.map((a) => a.id).filter((id): id is number => id !== null),
  );
  const newAdvisories = current.filter(
    (a) =>
      a.id !== null &&
      !baselineIds.has(a.id as number) &&
      BLOCKING_SEVERITIES.has(a.effectiveSeverity),
  );

  if (newAdvisories.length === 0) {
    console.log(
      'yarn audit: passed — no new advisories at moderate or higher severity.',
    );
    return;
  }

  // New advisories found — re-run native audit for colored output, then
  // print only the blocks that correspond to new advisory IDs.
  const nativeOutput = captureNativeAudit();
  const newIds = new Set(newAdvisories.map((a) => a.id));

  // Split native output into per-advisory blocks.  Each block starts with
  // "├─" or "└─" at column 0 (possibly wrapped in ANSI codes).  Inner tree
  // lines (Tree Versions, Dependents) are always indented, so a newline
  // followed by a non-space box-drawing char at column 0 marks the boundary.
  const blockBoundary = /\n(?=(?:\x1b\[[0-9;]*m)*[├└]─)/;
  const blocks = nativeOutput.split(blockBoundary);
  const matchingBlocks = blocks.filter((block) => {
    const idMatch = block.replace(/\x1b\[[0-9;]*m/g, '').match(/ID:\s*(\d+)/);
    return idMatch && newIds.has(Number(idMatch[1]));
  });

  console.log(
    `yarn audit: FAILED — ${newAdvisories.length} new advisor${newAdvisories.length === 1 ? 'y' : 'ies'}\n`,
  );
  console.log('Your dependency changes introduced new vulnerabilities:\n');
  process.stdout.write(matchingBlocks.join('\n'));
  console.log(
    '\nIf a newer version of the affected package is available, upgrade to it.',
  );
  process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
