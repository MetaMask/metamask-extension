import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SCRIPT = join(process.cwd(), '.github/scripts/benchmark-stats-commit.sh');

// Stands in for `git`: `clone` creates the target directory and `commit` copies
// the stats file the script wrote to `$FAKE_GIT_OUT`. Every other call is a no-op.
const FAKE_GIT = `#!/usr/bin/env bash
case "$1" in
  clone) mkdir -p "\${@: -1}" ;;
  commit) cp stats/main/performance_data.json "$FAKE_GIT_OUT" ;;
esac
`;

const iterationValues = {
  load: [
    { iteration: 0, value: 410 },
    { iteration: 2, value: 395 },
  ],
};

const measured = (title: string) => ({
  testTitle: title,
  mean: { load: 402.5 },
  values: iterationValues,
});

const hasKey = (node: unknown, key: string): boolean => {
  if (Array.isArray(node)) {
    return node.some((child) => hasKey(child, key));
  }
  if (node !== null && typeof node === 'object') {
    return Object.entries(node).some(
      ([name, child]) => name === key || hasKey(child, key),
    );
  }
  return false;
};

type StatsEntry = { presets: Record<string, Record<string, unknown>> };

const assemble = (files: Record<string, unknown>): StatsEntry => {
  const dir = mkdtempSync(join(tmpdir(), 'benchmark-stats-commit-'));
  try {
    const results = join(dir, 'results');
    const bin = join(dir, 'bin');
    const work = join(dir, 'work');
    for (const path of [results, bin, work]) {
      mkdirSync(path);
    }
    writeFileSync(join(bin, 'git'), FAKE_GIT);
    chmodSync(join(bin, 'git'), 0o755);
    for (const [name, content] of Object.entries(files)) {
      writeFileSync(join(results, name), JSON.stringify(content));
    }
    const out = join(dir, 'performance_data.json');

    const run = spawnSync('bash', [SCRIPT], {
      cwd: work,
      encoding: 'utf8',
      env: {
        PATH: `${bin}:${process.env.PATH}`,
        EXTENSION_BENCHMARK_STATS_TOKEN: 'token',
        HEAD_COMMIT_HASH: 'abc123',
        OWNER: 'owner',
        BENCHMARK_RESULTS_DIR: results,
        FAKE_GIT_OUT: out,
      },
    });

    expect(run.stderr).not.toContain('Warning');
    expect(run.status).toBe(0);
    return JSON.parse(readFileSync(out, 'utf8')).abc123;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

describe('benchmark-stats-commit.sh', () => {
  it('strips values from a startup file whose single key wraps the results', () => {
    const entry = assemble({
      'benchmark-chrome-webpack-startupStandardHome.json': {
        standardHome: measured('standardHome'),
      },
    });

    const stored = entry.presets.pageLoad['chrome-webpack-startupStandardHome'];
    expect(stored).toMatchObject({ mean: { load: 402.5 } });
    expect(hasKey(entry, 'values')).toBe(false);
  });

  it('strips values from a startup file with several top-level keys', () => {
    const entry = assemble({
      'benchmark-chrome-webpack-startupPowerUserHome.json': {
        powerUserHome: measured('powerUserHome'),
        standardHome: measured('standardHome'),
      },
    });

    const stored = entry.presets.pageLoad[
      'chrome-webpack-startupPowerUserHome'
    ] as Record<string, unknown>;
    expect(Object.keys(stored)).toStrictEqual([
      'powerUserHome',
      'standardHome',
    ]);
    expect(hasKey(entry, 'values')).toBe(false);
  });

  it('strips values from every flow of a user journey file and keeps the rest', () => {
    const entry = assemble({
      'benchmark-chrome-webpack-userJourneyAssets.json': {
        assetDetails: measured('assetDetails'),
        solanaAssetDetails: measured('solanaAssetDetails'),
        brokenFlow: { error: 'Error: flow failed' },
      },
    });

    expect(entry.presets.userJourneyAssets).toStrictEqual({
      assetDetails: { testTitle: 'assetDetails', mean: { load: 402.5 } },
      solanaAssetDetails: {
        testTitle: 'solanaAssetDetails',
        mean: { load: 402.5 },
      },
      brokenFlow: { error: 'Error: flow failed' },
    });
  });

  it('strips values nested below the first level of a flow', () => {
    const entry = assemble({
      'benchmark-chrome-webpack-pageLoadBenchmark.json': {
        pageLoadBenchmark: {
          ...measured('pageLoadBenchmark'),
          webVitals: { runs: [{ iteration: 0, values: [1, 2] }] },
        },
      },
    });

    expect(hasKey(entry, 'values')).toBe(false);
    expect(entry.presets.pageLoadBenchmark).toMatchObject({
      pageLoadBenchmark: { webVitals: { runs: [{ iteration: 0 }] } },
    });
  });
});
