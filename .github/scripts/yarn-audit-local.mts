/**
 * Local counterpart of the CI audit pipeline.  Runs `yarn audit`, downloads
 * the baseline from CloudFront, and diffs to show only NEW advisories
 * introduced by your changes — matching CI behavior.
 *
 * Usage:
 *   yarn audit:diff
 */

import { spawnSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import {
  AUDIT_BASELINE_FILE,
  AUDIT_CURRENT_FILE,
  BLOCKING_SEVERITIES,
  type ParsedAdvisory,
  formatAdvisoryTree,
} from './shared/audit-utils.mts';

const BASELINE_URL =
  'https://diuv6g5fj9pvx.cloudfront.net/metamask-extension/audit-baseline/audit-baseline.json';

async function main() {
  mkdirSync('.tmp', { recursive: true });

  // -----------------------------------------------------------------------
  // Step 1 — Run the triage script to produce .tmp/audit-current.json
  // -----------------------------------------------------------------------
  console.log('Running yarn audit…\n');
  spawnSync('yarn', ['tsx', '.github/scripts/yarn-audit-and-triage.mts'], {
    // stdout is piped (suppressed) — it contains CI-formatted JSON + annotations.
    // stderr is inherited — real errors are visible.
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
  // Step 2 — Download baseline from CloudFront
  // -----------------------------------------------------------------------
  console.log('Downloading baseline from main…\n');
  let baseline: ParsedAdvisory[];
  try {
    const response = await fetch(BASELINE_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const text = await response.text();
    baseline = JSON.parse(text) as ParsedAdvisory[];
    if (!Array.isArray(baseline)) {
      throw new Error('Baseline is not a JSON array');
    }
    writeFileSync(
      AUDIT_BASELINE_FILE,
      JSON.stringify(baseline, null, 2),
      'utf8',
    );
  } catch (error) {
    console.log(`Could not download baseline: ${error}\n`);
    console.log(
      'No baseline available — showing absolute results (severity >= moderate).\n',
    );
    const blocking = current.filter(
      (a) =>
        a.affectsProduction && BLOCKING_SEVERITIES.has(a.effectiveSeverity),
    );
    if (blocking.length === 0) {
      console.log(
        'yarn audit: passed — no production vulnerabilities at moderate or higher severity.',
      );
    } else {
      console.log(
        `yarn audit: FAILED — ${blocking.length} production vulnerabilit${blocking.length === 1 ? 'y' : 'ies'}\n`,
      );
      console.log(blocking.map(formatAdvisoryTree).join('\n\n'));
      process.exitCode = 1;
    }
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

  // New advisories found — fail.
  console.log(
    `yarn audit: FAILED — ${newAdvisories.length} new advisor${newAdvisories.length === 1 ? 'y' : 'ies'}\n`,
  );
  console.log(
    'Your dependency changes introduced new vulnerabilities:\n',
  );
  console.log(newAdvisories.map(formatAdvisoryTree).join('\n\n'));
  console.log(
    '\nIf a newer version of the affected package is available, upgrade to it.',
  );
  process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
