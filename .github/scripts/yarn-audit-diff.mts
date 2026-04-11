import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'fs';

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);

const baselineFile = (() => {
  const i = args.indexOf('--baseline-file');
  return i !== -1 ? (args[i + 1] ?? null) : null;
})();

const currentFile = (() => {
  const i = args.indexOf('--current-file');
  return i !== -1 ? (args[i + 1] ?? null) : null;
})();

// When set, a missing or empty baseline exits 0 instead of 1.
// Intended for initial rollout (before the first push-to-main deposits a
// baseline artifact) and for new repository onboarding. The workflow passes
// this flag until a baseline exists; once established, the flag is removed
// from the workflow step.
const skipIfNoBaseline = args.includes('--skip-if-no-baseline');

// ---------------------------------------------------------------------------
// Types (subset of ParsedAdvisory from yarn-audit-and-triage.mts)
// ---------------------------------------------------------------------------

type ParsedAdvisory = {
  id: number | null;
  moduleName: string;
  title: string;
  url: string;
  effectiveSeverity?: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readAdvisories(filePath: string | null): ParsedAdvisory[] | null {
  if (!filePath) {
    return null;
  }
  try {
    const text = readFileSync(filePath, 'utf8').trim();
    if (!text || text === '[]') {
      return [];
    }
    return JSON.parse(text) as ParsedAdvisory[];
  } catch {
    return null;
  }
}

function sevLabel(a: ParsedAdvisory): string {
  return (a.effectiveSeverity ?? 'unknown').toUpperCase();
}

function writeStepSummary(text: string): void {
  const path = process.env.GITHUB_STEP_SUMMARY;
  if (!path) return;
  try {
    if (!existsSync(path)) writeFileSync(path, '', 'utf8');
    appendFileSync(path, text, 'utf8');
  } catch {
    // best-effort
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  if (!currentFile) {
    console.error('--current-file is required');
    process.exitCode = 1;
    return;
  }

  const current = readAdvisories(currentFile);
  if (!current) {
    console.error(`Could not read current advisories from: ${currentFile}`);
    process.exitCode = 1;
    return;
  }

  const baseline = readAdvisories(baselineFile);
  const baselineIsEmpty = !baseline || baseline.length === 0;

  // ------------------------------------------------------------------
  // Missing / empty baseline
  // ------------------------------------------------------------------
  if (baselineIsEmpty) {
    if (skipIfNoBaseline) {
      // Rollout mode: no baseline available yet. Post success and exit 0 so
      // this PR isn't blocked. Remove --skip-if-no-baseline after the first
      // push-to-main run deposits the baseline artifact.
      console.log(
        '::notice::No baseline found — posting success (skip-if-no-baseline mode).',
      );
      writeStepSummary(
        '\n> **Audit diff:** No baseline yet — diff skipped (rollout mode).\n',
      );
      return;
    }

    // No baseline = treat all current advisories as new → block.
    console.log(
      `::warning::No baseline found. Treating all ${current.length} advisory/advisories as new.`,
    );
    writeStepSummary(
      `\n> **Audit diff:** No baseline — treating all **${current.length}** advisor${current.length === 1 ? 'y' : 'ies'} as new.\n`,
    );
    process.exitCode = 1;
    return;
  }

  // ------------------------------------------------------------------
  // Diff: advisories present in current but not in baseline (by GHSA ID)
  // ------------------------------------------------------------------
  const baselineIds = new Set(
    baseline.map((a) => a.id).filter((id): id is number => id !== null),
  );

  const newAdvisories = current.filter(
    (a) => a.id !== null && !baselineIds.has(a.id as number),
  );

  if (newAdvisories.length === 0) {
    console.log(
      `No new advisories. Current: ${current.length}, baseline: ${baseline.length}.`,
    );
    writeStepSummary(
      `\n### No new advisories introduced by this PR\n\n(${current.length} current vs ${baseline.length} baseline)\n`,
    );
    return;
  }

  // New advisories found — fail the job.
  console.log(
    `Found ${newAdvisories.length} new advisory/advisories not in baseline.`,
  );
  for (const a of newAdvisories) {
    console.log(
      `::error::New advisory [${sevLabel(a)}]: ${a.moduleName} — ${a.title} (${a.url})`,
    );
  }

  const diffSummaryLines = [
    '',
    `### ${newAdvisories.length} new advisor${newAdvisories.length === 1 ? 'y' : 'ies'} introduced by this PR`,
    '',
    ...newAdvisories.map(
      (a) =>
        `- **[${sevLabel(a)}]** \`${a.moduleName}\` — ${a.title} (<${a.url}>)`,
    ),
    '',
  ];
  writeStepSummary(diffSummaryLines.join('\n'));
  process.exitCode = 1;
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
