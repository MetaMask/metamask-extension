import { readFileSync } from 'fs';
import {
  AUDIT_BASELINE_FILE,
  AUDIT_CURRENT_FILE,
  AUDIT_DETAILS_FILE,
  type ParsedAdvisory,
  writeStepSummary,
} from './shared/audit-utils.mts';

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

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const current = readAdvisories(AUDIT_CURRENT_FILE);
  if (!current) {
    console.error(
      `Could not read current advisories from: ${AUDIT_CURRENT_FILE}`,
    );
    process.exitCode = 1;
    return;
  }

  const baseline = readAdvisories(AUDIT_BASELINE_FILE);
  const baselineIsEmpty = !baseline || baseline.length === 0;

  // ------------------------------------------------------------------
  // Missing / empty baseline
  // ------------------------------------------------------------------
  if (baselineIsEmpty) {
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
} finally {
  // Append the full advisory details written by yarn-audit-and-triage.mts,
  // so they appear after the diff verdict in the step summary.
  try {
    const details = readFileSync(AUDIT_DETAILS_FILE, 'utf8');
    writeStepSummary(`\n${details}`);
  } catch {
    // File may not exist (e.g. triage step failed before writing it).
  }
}
