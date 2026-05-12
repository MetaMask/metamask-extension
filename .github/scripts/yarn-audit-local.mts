/**
 * Local counterpart of the CI audit pipeline.  Runs `yarn audit`, downloads
 * the baseline from CloudFront, and diffs to show only NEW advisories
 * introduced by your changes — matching CI behavior.
 *
 * Usage:
 *   yarn audit
 */

import { spawn, spawnSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import {
  AUDIT_BASELINE_FILE,
  AUDIT_CURRENT_FILE,
  AUDIT_RAW_DEV,
  AUDIT_RAW_PROD,
  BLOCKING_SEVERITIES,
  extractNativeBlocks,
  readAdvisories,
  type ParsedAdvisory,
} from './shared/audit-utils.mts';
import { main as runTriage } from './yarn-audit-and-triage.mts';

const BASELINE_URL =
  'https://diuv6g5fj9pvx.cloudfront.net/metamask-extension/audit-baseline';

/**
 * Spawn a command and collect its combined stdout+stderr into a string.
 * Returns a promise that resolves when the process exits.
 */
function spawnCollect(cmd: string): Promise<string> {
  return new Promise((resolve) => {
    const child = spawn(cmd, { shell: true });
    const chunks: Buffer[] = [];
    child.stdout?.on('data', (d: Buffer) => chunks.push(d));
    child.stderr?.on('data', (d: Buffer) => chunks.push(d));
    child.on('close', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
}

/**
 * Run `yarn npm audit` in pretty (non-JSON) mode and return the colored
 * terminal output exactly as yarn renders it.
 */
function captureNativeAudit(): { output: string; exitCode: number } {
  const cmd =
    'yarn npm audit --recursive --environment production --severity moderate';
  const result = spawnSync(cmd, {
    encoding: 'utf8',
    shell: true,
    env: { ...process.env, FORCE_COLOR: '1' },
  });
  return {
    output: `${result.stdout ?? ''}${result.stderr ?? ''}`,
    exitCode: result.status ?? 1,
  };
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
    const { output, exitCode } = captureNativeAudit();
    if (output.trim()) {
      process.stdout.write(output);
    }
    if (exitCode !== 0) {
      process.exitCode = 1;
    } else {
      console.log(
        'yarn audit: passed — no production vulnerabilities at moderate or higher severity.',
      );
    }
    return;
  }

  // -----------------------------------------------------------------------
  // Step 2 — Pre-warm JSON audits in parallel, then run triage
  // The triage script checks for these files and skips its own spawnSync
  // when they exist, so the two JSON audits overlap instead of running
  // sequentially (~16s vs ~30s on a local machine).
  // -----------------------------------------------------------------------
  console.log('Running yarn audit…\n');
  const [prodRaw, devRaw] = await Promise.all([
    spawnCollect('yarn npm audit --recursive --environment production --json'),
    spawnCollect('yarn npm audit --recursive --environment development --json'),
  ]);
  writeFileSync(AUDIT_RAW_PROD, prodRaw, 'utf8');
  writeFileSync(AUDIT_RAW_DEV, devRaw, 'utf8');

  runTriage();

  if (!existsSync(AUDIT_CURRENT_FILE)) {
    console.error(
      `Audit failed — ${AUDIT_CURRENT_FILE} was not created. Check stderr above.`,
    );
    process.exitCode = 1;
    return;
  }

  const current = readAdvisories(AUDIT_CURRENT_FILE);
  if (!current) {
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
  // Advisories with null IDs are intentionally excluded — they represent
  // malformed data that cannot be reliably diffed against the baseline.
  const newAdvisories = current.filter(
    (a) =>
      a.id !== null &&
      !baselineIds.has(a.id as number) &&
      a.affectsProduction &&
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
  const { output: nativeOutput } = captureNativeAudit();
  const newIds = new Set(
    newAdvisories.map((a) => a.id).filter((id): id is number => id !== null),
  );
  const matchingBlocks = extractNativeBlocks(nativeOutput, newIds);

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
