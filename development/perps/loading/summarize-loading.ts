import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { isColdMode, resolveMeasurementPath } from './browser-process.ts'; // eslint-disable-line import-x/extensions -- Native Node TypeScript execution requires the extension.

type Measurement = {
  arm: string;
  mode: string;
  accountName?: string;
  beforePid: string;
  afterPid: string;
  checkoutHead: string;
  build: { sourceRef: string; provenanceSha256: string };
  collectorSha256: string;
  formatterSha256: string;
  metrics: { entryToRowsMs: number; entryToLiveMs: number };
  accuracy: { matched: boolean }[];
  observation: {
    entry: number;
    firstRows: number;
    ready: number;
    perpsClick: number;
    switchClick?: number;
    expectedAddress?: string;
    selectedAddress: string;
    managerAddress: string;
  };
  requests: {
    url: string;
    status?: number;
    diskCache?: boolean;
    bytes?: number;
  }[];
};
/**
 * Validate and summarize the declared measurement cohorts.
 * @param evidenceDirectory - Existing evidence directory.
 * @param workspace - Trusted working directory containing the evidence.
 */
export function summarizeLoading(
  evidenceDirectory: string,
  workspace = process.cwd(),
) {
  const root = resolveMeasurementPath(workspace, evidenceDirectory);
  const manifest: {
    cohorts: {
      arm: string;
      mode: string;
      accountName?: string;
      sourceRef: string;
      buildProvenanceSha256: string;
      collectorSha256: string;
      formatterSha256: string;
      samples: string[];
    }[];
  } = JSON.parse(
    readFileSync(resolveMeasurementPath(root, 'sample-manifest.json'), 'utf8'),
  );
  assert(manifest.cohorts.length > 0, 'Declare at least one cohort');
  assert(
    manifest.cohorts.every((cohort) => cohort.samples.length >= 3),
    'Declare at least three samples per cohort',
  );
  const cohortKey = ({
    arm,
    mode,
    accountName,
  }: {
    arm: string;
    mode: string;
    accountName?: string;
  }) => [arm, mode, accountName].filter(Boolean).join('/');
  const cohortKeys = manifest.cohorts.map(cohortKey);
  assert(
    new Set(cohortKeys).size === cohortKeys.length,
    'Duplicate cohort key would merge distinct sample populations',
  );
  const declared = manifest.cohorts.flatMap((cohort) =>
    cohort.samples.map((directory) => ({ cohort, directory })),
  );
  assert(
    new Set(declared.map((item) => item.directory)).size === declared.length,
    'Sample declared twice',
  );
  const missing: string[] = [];
  const excluded = readdirSync(root, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isDirectory() &&
        /^(before|after)-/u.test(entry.name) &&
        !declared.some((item) => item.directory === entry.name),
    )
    .map((entry) => entry.name);
  const groups = new Map<
    string,
    {
      file: string;
      rowsMs: number;
      liveMs: number;
      perpsClickDelayMs: number;
      head: string;
      collector: string;
    }[]
  >();
  const failures: string[] = [];
  for (const { cohort, directory } of declared) {
    assert(
      /^(before|after)-[a-z0-9_-]+$/u.test(directory),
      'Invalid sample directory',
    );
    const folder = resolveMeasurementPath(root, directory);
    const file = resolveMeasurementPath(
      root,
      path.join(folder, 'measurements.json'),
    );
    if (
      existsSync(
        resolveMeasurementPath(root, path.join(folder, 'cohort-failure.json')),
      ) ||
      existsSync(
        resolveMeasurementPath(root, path.join(folder, 'failure.json')),
      )
    ) {
      failures.push(directory);
      continue;
    }
    if (!existsSync(file)) {
      missing.push(directory);
      continue;
    }
    const measurement: Measurement = JSON.parse(readFileSync(file, 'utf8'));
    const summary: { status: string } = JSON.parse(
      readFileSync(
        resolveMeasurementPath(
          root,
          path.join(folder, 'recipe-run/summary.json'),
        ),
        'utf8',
      ),
    );
    assert(measurement.arm === cohort.arm);
    assert(measurement.mode === cohort.mode);
    assert(measurement.accountName === cohort.accountName);
    assert(
      measurement.build.sourceRef === cohort.sourceRef,
      'Unexpected build mixture',
    );
    assert(
      measurement.collectorSha256 === cohort.collectorSha256,
      'Unexpected collector mixture',
    );
    assert.match(cohort.buildProvenanceSha256, /^[a-f0-9]{64}$/u);
    assert.match(cohort.formatterSha256, /^[a-f0-9]{64}$/u);
    assert(
      measurement.build.provenanceSha256 === cohort.buildProvenanceSha256,
      'Unexpected executable build mixture',
    );
    assert(
      measurement.formatterSha256 === cohort.formatterSha256,
      'Unexpected formatter mixture',
    );
    assert(
      Number.isFinite(measurement.metrics.entryToRowsMs) &&
        measurement.metrics.entryToRowsMs >= 0,
    );
    assert(
      Number.isFinite(measurement.metrics.entryToLiveMs) &&
        measurement.metrics.entryToLiveMs >= 0,
    );
    const { observation } = measurement;
    assert(summary.status === 'pass');
    assert(
      measurement.metrics.entryToRowsMs ===
        observation.firstRows - observation.entry,
    );
    assert(
      measurement.metrics.entryToLiveMs ===
        observation.ready - observation.entry,
    );
    assert(
      measurement.accuracy.length > 0 &&
        measurement.accuracy.every((row) => row.matched),
    );
    assert(
      observation.selectedAddress.toLowerCase() ===
        observation.managerAddress.toLowerCase(),
    );
    if (measurement.mode === 'account') {
      assert(
        observation.expectedAddress?.toLowerCase() ===
          observation.selectedAddress.toLowerCase(),
      );
      assert(observation.entry === observation.switchClick);
    }
    if (isColdMode(measurement.mode)) {
      assert(measurement.beforePid !== measurement.afterPid);
      assert(
        measurement.requests.some(
          (request) =>
            request.status === 200 &&
            request.diskCache === false &&
            Number(request.bytes) > 0 &&
            /terminal\.[^/]+\/v1\/perpetuals$/u.test(request.url),
        ),
      );
    }
    const key = cohortKey(measurement);
    const samples = groups.get(key) ?? [];
    samples.push({
      file: path.relative(root, file),
      rowsMs: measurement.metrics.entryToRowsMs,
      liveMs: measurement.metrics.entryToLiveMs,
      perpsClickDelayMs:
        measurement.mode === 'account'
          ? observation.perpsClick - observation.entry
          : 0,
      head: measurement.build.sourceRef,
      collector: measurement.collectorSha256,
    });
    groups.set(key, samples);
  }
  const statistics = (values: number[]) => {
    const sorted = [...values].sort((left, right) => left - right);
    return {
      count: sorted.length,
      median:
        (sorted[Math.floor((sorted.length - 1) / 2)] +
          sorted[Math.floor(sorted.length / 2)]) /
        2,
      min: sorted[0],
      max: sorted.at(-1),
    };
  };
  const report = {
    authority:
      'Real browser click to priced DOM rows; SDK durations have different boundaries and are retained in raw measurements.',
    failures,
    missing,
    excluded,
    complete: failures.length === 0 && missing.length === 0,
    groups: [...groups].map(([key, samples]) => ({
      key,
      samples,
      clickToRows: statistics(samples.map((sample) => sample.rowsMs)),
      clickToLive: statistics(samples.map((sample) => sample.liveMs)),
    })),
  };
  writeFileSync(
    resolveMeasurementPath(root, 'comparison.json'),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  return report;
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) ===
    path.join(process.cwd(), 'development/perps/loading/summarize-loading.ts')
) {
  const report = summarizeLoading(process.argv[2]);
  console.log(JSON.stringify(report, null, 2));
  if (!report.complete) {
    process.exitCode = 1;
  }
}
