import { readFileSync } from 'fs';
import path from 'path';
import { parse } from 'yaml';
import { PAIRED_DIFFERENCES } from '../../../../development/metamaskbot-build-announce/paired-gate';
import { ADMITTED_SERIES } from './gated-metrics';
import { PAIRED_ORDERS } from './paired';
import {
  CI_PRESETS,
  admittedFlowNames,
  getBenchmarkLegs,
  getPairedFlows,
  omitFiles,
  type PairedFlow,
} from './paired-flows';
import { PRESETS } from './presets';

const WORKFLOWS = path.resolve(__dirname, '../../../../.github/workflows');
const readWorkflow = (name: string) =>
  parse(readFileSync(path.join(WORKFLOWS, name), 'utf8'));

/** The two `fromJSON` literals of the benchmark workflow's matrix: unpaired, then paired. */
function workflowLegs(): [unknown, unknown] {
  const { include } = readWorkflow('run-benchmarks.yml').jobs.benchmarks
    .strategy.matrix as { include: string };
  const match =
    /fromJSON\(inputs\.base-builds-from-run == '' && '([^']*)' \|\| '([^']*)'\)/u.exec(
      include,
    );
  if (!match) {
    throw new Error(`The matrix is not two literals: ${include}`);
  }
  return [JSON.parse(match[1]), JSON.parse(match[2])];
}

describe('paired flows', () => {
  it('are the flows with an admitted series, each with its file', () => {
    expect(getPairedFlows().map(({ name }) => name)).toStrictEqual([
      'bridgeUserActions',
      'startupStandardHome',
      'assetDetails',
      'solanaAssetDetails',
      'loadNewAccount',
    ]);
    for (const { file } of getPairedFlows()) {
      expect(Object.values(PRESETS).flat()).toContain(file);
    }
  });

  it('name a flow of every admitted series', () => {
    const flows = new Set(getPairedFlows().map(({ name }) => name));
    for (const { series } of ADMITTED_SERIES) {
      expect(flows.has(series.split('.')[0])).toBe(true);
    }
    expect(admittedFlowNames()).toHaveLength(flows.size);
  });

  it('leave out confirmTx, which timed out paired at 1557 s', () => {
    expect(getPairedFlows().map(({ name }) => name)).not.toContain('confirmTx');
  });
});

describe('the benchmark workflow matrix', () => {
  it('lists the jobs getBenchmarkLegs gives', () => {
    const [unpaired, paired] = workflowLegs();

    expect(unpaired).toStrictEqual(getBenchmarkLegs(false));
    expect(paired).toStrictEqual(getBenchmarkLegs(true));
  });

  it('runs every preset file on each browser once unpaired', () => {
    for (const browser of ['chrome', 'firefox']) {
      const files = getBenchmarkLegs(false)
        .filter((leg) => leg.browser === browser)
        .flatMap((leg) =>
          omitFiles(PRESETS[leg.pageType], leg.skip.split(' ')),
        );
      const expected = CI_PRESETS.flatMap((preset) => PRESETS[preset]);

      expect(files.sort()).toStrictEqual(expected.sort());
    }
  });

  it('runs every file once per browser when paired, the paired flows on Chrome only', () => {
    const everyFile = CI_PRESETS.flatMap((preset) => PRESETS[preset]).sort();
    const pairedFiles = getPairedFlows().map(({ file }) => file);
    const legs = getBenchmarkLegs(true);

    for (const browser of ['chrome', 'firefox'] as const) {
      const unpairedFiles = legs
        .filter((leg) => leg.browser === browser && leg.pageType !== '')
        .flatMap((leg) =>
          omitFiles(PRESETS[leg.pageType], leg.skip.split(' ')),
        );
      const pairedOnBrowser = legs
        .filter((leg) => leg.browser === browser && leg.pairedFlow !== '')
        .map((leg) => (leg.pairedFlow as { file: string }).file);

      if (browser === 'chrome') {
        expect(unpairedFiles.some((file) => pairedFiles.includes(file))).toBe(
          false,
        );
        // Each paired flow runs twice per order.
        expect([...new Set(pairedOnBrowser)].sort()).toStrictEqual(
          [...pairedFiles].sort(),
        );
        expect(pairedOnBrowser).toHaveLength(pairedFiles.length * 4);
        expect(
          [...unpairedFiles, ...new Set(pairedOnBrowser)].sort(),
        ).toStrictEqual(everyFile);
      } else {
        // Firefox runs no paired job, so it keeps every file unpaired.
        expect(pairedOnBrowser).toStrictEqual([]);
        expect(unpairedFiles.sort()).toStrictEqual(everyFile);
      }
    }
  });

  it('gives each paired flow two jobs in each order, and no preset', () => {
    const legs = getBenchmarkLegs(true).filter((leg) => leg.pairedFlow !== '');

    for (const { name } of getPairedFlows()) {
      for (const order of PAIRED_ORDERS) {
        expect(
          legs
            .filter(
              (leg) =>
                (leg.pairedFlow as PairedFlow).name === name &&
                leg.pairedOrder === order,
            )
            .map((leg) => leg.pairedRepeat),
        ).toStrictEqual([1, 2]);
      }
    }
    expect(legs).toHaveLength(getPairedFlows().length * 4);
    // Each job gives two differences, the count the gate requires per series.
    expect((legs.length / getPairedFlows().length) * 2).toBe(
      PAIRED_DIFFERENCES,
    );
    expect(legs.every((leg) => leg.pageType === '' && leg.skip === '')).toBe(
      true,
    );
  });

  it('names each paired job, and so its artifact, once', () => {
    const names = getBenchmarkLegs(true)
      .filter((leg) => leg.pairedFlow !== '')
      .map(
        (leg) =>
          `${(leg.pairedFlow as PairedFlow).name}-r${leg.pairedRepeat}-${leg.pairedOrder}`,
      );

    expect(new Set(names).size).toBe(names.length);
    const workflow = readFileSync(
      path.join(WORKFLOWS, 'run-benchmarks.yml'),
      'utf8',
    );
    expect(workflow).toContain(
      "format('{0}-r{1}-{2}', matrix.pairedFlow.name, matrix.pairedRepeat, matrix.pairedOrder)",
    );
  });
});

describe('the base build jobs', () => {
  it('keep the base build out of the names main.yml says a reused run must hold', () => {
    const main = readFileSync(path.join(WORKFLOWS, 'main.yml'), 'utf8');
    const names = [...main.matchAll(/build-name: (\S+)/gu)].map(
      (match) => match[1],
    );

    expect(names).toContain('build-test-webpack');
    expect(names).not.toContain('base-build-test-webpack');
    expect(
      readFileSync(path.join(WORKFLOWS, 'build-base-test.yml'), 'utf8'),
    ).toContain('build-name: base-build-test-webpack');
  });
});

describe('omitFiles', () => {
  it('drops the files that run paired and keeps the order of the rest', () => {
    expect(omitFiles(['a.ts', 'b.ts', 'c.ts'], ['b.ts'])).toStrictEqual([
      'a.ts',
      'c.ts',
    ]);
    expect(omitFiles(['a.ts'], [])).toStrictEqual(['a.ts']);
  });
});
