import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const { isColdMode }: typeof import('./browser-process') = await import(
  new URL('./browser-process.ts', import.meta.url).href
);

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
const root = path.resolve(process.argv[2]);
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
} = JSON.parse(readFileSync(path.join(root, 'sample-manifest.json'), 'utf8'));
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
assert.equal(
  new Set(cohortKeys).size,
  cohortKeys.length,
  'Duplicate cohort key would merge distinct sample populations',
);
const declared = manifest.cohorts.flatMap((cohort) =>
  cohort.samples.map((directory) => ({ cohort, directory })),
);
assert.equal(
  new Set(declared.map((item) => item.directory)).size,
  declared.length,
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
  const folder = path.join(root, directory);
  const file = path.join(folder, 'measurements.json');
  if (
    existsSync(path.join(folder, 'cohort-failure.json')) ||
    existsSync(path.join(folder, 'failure.json'))
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
    readFileSync(path.join(folder, 'recipe-run/summary.json'), 'utf8'),
  );
  assert.equal(measurement.arm, cohort.arm);
  assert.equal(measurement.mode, cohort.mode);
  assert.equal(measurement.accountName, cohort.accountName);
  assert.equal(
    measurement.build.sourceRef,
    cohort.sourceRef,
    'Unexpected build mixture',
  );
  assert.equal(
    measurement.collectorSha256,
    cohort.collectorSha256,
    'Unexpected collector mixture',
  );
  assert.match(cohort.buildProvenanceSha256, /^[a-f0-9]{64}$/u);
  assert.match(cohort.formatterSha256, /^[a-f0-9]{64}$/u);
  assert.equal(
    measurement.build.provenanceSha256,
    cohort.buildProvenanceSha256,
    'Unexpected executable build mixture',
  );
  assert.equal(
    measurement.formatterSha256,
    cohort.formatterSha256,
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
  assert.equal(summary.status, 'pass');
  assert.equal(
    measurement.metrics.entryToRowsMs,
    observation.firstRows - observation.entry,
  );
  assert.equal(
    measurement.metrics.entryToLiveMs,
    observation.ready - observation.entry,
  );
  assert(
    measurement.accuracy.length > 0 &&
      measurement.accuracy.every((row) => row.matched),
  );
  assert.equal(
    observation.selectedAddress.toLowerCase(),
    observation.managerAddress.toLowerCase(),
  );
  if (measurement.mode === 'account') {
    assert.equal(
      observation.expectedAddress?.toLowerCase(),
      observation.selectedAddress.toLowerCase(),
    );
    assert.equal(observation.entry, observation.switchClick);
  }
  if (isColdMode(measurement.mode)) {
    assert.notEqual(measurement.beforePid, measurement.afterPid);
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
  path.join(root, 'comparison.json'),
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log(JSON.stringify(report, null, 2));
if (!report.complete) {
  process.exitCode = 1;
}
