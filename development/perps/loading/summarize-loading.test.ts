import { spawnSync } from 'node:child_process';
import {
  cpSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

describe('loading cohort summary', () => {
  let root: string;
  const hash = 'a'.repeat(64);
  const samples = ['after-warm-1', 'after-warm-2', 'after-warm-3'];

  function write(relative: string, value: unknown) {
    writeFileSync(path.join(root, relative), JSON.stringify(value));
  }

  function summarize() {
    return spawnSync(
      process.execPath,
      [path.join(__dirname, 'summarize-loading.ts'), root],
      { encoding: 'utf8' },
    );
  }

  beforeEach(() => {
    root = mkdtempSync(path.join(tmpdir(), 'perps-summary-test-'));
    write('sample-manifest.json', {
      cohorts: [
        {
          arm: 'after',
          mode: 'warm',
          sourceRef: 'fixture-only',
          collectorSha256: hash,
          formatterSha256: hash,
          buildProvenanceSha256: hash,
          samples,
        },
      ],
    });
    samples.forEach((sample, index) => {
      mkdirSync(path.join(root, sample, 'recipe-run'), { recursive: true });
      write(`${sample}/recipe-run/summary.json`, { status: 'pass' });
      write(`${sample}/measurements.json`, {
        arm: 'after',
        mode: 'warm',
        build: { sourceRef: 'fixture-only', provenanceSha256: hash },
        collectorSha256: hash,
        formatterSha256: hash,
        metrics: { entryToRowsMs: 10 + index, entryToLiveMs: 20 + index },
        accuracy: [{ matched: true }],
        observation: {
          entry: 100,
          firstRows: 110 + index,
          ready: 120 + index,
          selectedAddress: '0xABC',
          managerAddress: '0xabc',
        },
      });
    });
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('computes the declared median and excludes undeclared probes', () => {
    mkdirSync(path.join(root, 'after-warm-probe'));
    const result = summarize();
    expect(result.status).toBe(0);
    const report = JSON.parse(
      readFileSync(path.join(root, 'comparison.json'), 'utf8'),
    );
    expect(report.complete).toBe(true);
    expect(report.excluded).toStrictEqual(['after-warm-probe']);
    expect(report.groups[0].clickToRows).toStrictEqual({
      count: 3,
      median: 11,
      min: 10,
      max: 12,
    });
  });

  it('rejects different executable builds with the same source reference', () => {
    const file = `${samples[0]}/measurements.json`;
    const value = JSON.parse(readFileSync(path.join(root, file), 'utf8'));
    value.build.provenanceSha256 = 'b'.repeat(64);
    write(file, value);
    const result = summarize();
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('Unexpected executable build mixture');
  });

  it('fails an incomplete declared cohort and retains the failed sample', () => {
    write(`${samples[0]}/failure.json`, { error: 'synthetic failure' });
    const result = summarize();
    expect(result.status).toBe(1);
    const report = JSON.parse(
      readFileSync(path.join(root, 'comparison.json'), 'utf8'),
    );
    expect(report.complete).toBe(false);
    expect(report.failures).toStrictEqual([samples[0]]);
    expect(report.groups[0].clickToRows.count).toBe(2);
  });

  it('rejects duplicate cohort keys even when each cohort has valid provenance', () => {
    const manifest = JSON.parse(
      readFileSync(path.join(root, 'sample-manifest.json'), 'utf8'),
    );
    const secondSamples = samples.map((sample, index) => {
      const name = `after-warm-${index + 4}`;
      cpSync(path.join(root, sample), path.join(root, name), {
        recursive: true,
      });
      const file = `${name}/measurements.json`;
      const value = JSON.parse(readFileSync(path.join(root, file), 'utf8'));
      value.build.provenanceSha256 = 'b'.repeat(64);
      write(file, value);
      return name;
    });
    manifest.cohorts.push({
      ...manifest.cohorts[0],
      samples: secondSamples,
      buildProvenanceSha256: 'b'.repeat(64),
    });
    write('sample-manifest.json', manifest);
    const result = summarize();
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('Duplicate cohort key');
  });

  it('rejects a duration inconsistent with its raw timestamps', () => {
    const file = `${samples[0]}/measurements.json`;
    const value = JSON.parse(readFileSync(path.join(root, file), 'utf8'));
    value.metrics.entryToRowsMs = 0;
    write(file, value);
    expect(summarize().status).not.toBe(0);
  });
});
