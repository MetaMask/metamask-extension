import { readFileSync, writeFileSync } from 'fs';

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

// When set, a missing or empty baseline posts `success` instead of `failure`.
// Used during rollout before the first push-to-main deposits the baseline
// artifact. Remove this flag after the first successful main push.
const skipIfNoBaseline = args.includes('--skip-if-no-baseline');

const resultFile = (() => {
  const i = args.indexOf('--result-file');
  return i !== -1 ? (args[i + 1] ?? null) : null;
})();

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

function toAnnotation(a: ParsedAdvisory): object {
  return {
    path: '.github',
    start_line: 1,
    end_line: 1,
    annotation_level: 'failure',
    message: `New advisory: [${sevLabel(a)}] ${a.moduleName} \u2014 ${a.title} (${a.url})`,
  };
}

// ---------------------------------------------------------------------------
// Result file
// ---------------------------------------------------------------------------

type DiffResult = {
  conclusion: 'success' | 'failure';
  title: string;
  summary: string;
  annotations: object[];
};

function writeResult(result: DiffResult): void {
  if (resultFile) {
    writeFileSync(resultFile, JSON.stringify(result, null, 2), 'utf8');
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
      writeResult({
        conclusion: 'success',
        title: 'No baseline yet',
        summary: 'Baseline artifact not yet available. Diff skipped (rollout mode — `--skip-if-no-baseline` flag is set).',
        annotations: [],
      });
      return;
    }

    // No baseline = treat all current advisories as new → block.
    console.log(
      `::warning::No baseline found. Treating all ${current.length} advisory/advisories as new.`,
    );
    const summary =
      `No baseline artifact found. Treating all **${current.length}** advisory/advisories as new.\n\n` +
      current
        .map((a) => `- [${sevLabel(a)}] \`${a.moduleName}\` — ${a.title}`)
        .join('\n');
    // The Checks API rejects requests with more than 50 annotations.
    writeResult({
      conclusion: 'failure',
      title: 'New vulnerabilities found',
      summary,
      annotations: current.slice(0, 50).map(toAnnotation),
    });
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
    writeResult({
      conclusion: 'success',
      title: 'No new vulnerabilities',
      summary: `Compared **${current.length}** current advisory/advisories against **${baseline.length}** baseline. No new advisories introduced by this PR.`,
      annotations: [],
    });
    return;
  }

  // New advisories found — post a failure check run.
  console.log(
    `Found ${newAdvisories.length} new advisory/advisories not in baseline.`,
  );
  for (const a of newAdvisories) {
    console.log(`  [${sevLabel(a)}] ${a.moduleName} — ${a.title} (${a.url})`);
  }

  const summaryBody =
    `Found **${newAdvisories.length}** new advisory/advisories not present in the baseline.\n\n` +
    newAdvisories
      .map(
        (a) =>
          `- [${sevLabel(a)}] \`${a.moduleName}\` — ${a.title} (<${a.url}>)`,
      )
      .join('\n');

  // The Checks API rejects requests with more than 50 annotations.
  writeResult({
    conclusion: 'failure',
    title: 'New vulnerabilities found',
    summary: summaryBody,
    annotations: newAdvisories.slice(0, 50).map(toAnnotation),
  });
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
