import {
  benchmarkNamesForPreset,
  expectedBenchmarkArtifacts,
  MATRIX_PRESETS,
  PRESET_BENCHMARK_FILES,
} from './presets';

describe('MATRIX_PRESETS', () => {
  it('lists every preset the CI matrix runs, and not the page-load one', () => {
    expect(MATRIX_PRESETS).toStrictEqual([
      'startupStandardHome',
      'startupPowerUserHome',
      'interactionUserActions',
      'userJourneyOnboardingImport',
      'userJourneyOnboardingNew',
      'userJourneyAssets',
      'userJourneyAccountManagement',
      'userJourneyTransactions',
    ]);
    expect(MATRIX_PRESETS).not.toContain('pageLoadBenchmark');
  });
});

describe('benchmarkNamesForPreset', () => {
  it.each([
    ['userJourneyTransactions', ['sendTransactions', 'swap']],
    ['userJourneyAssets', ['assetDetails', 'solanaAssetDetails']],
    ['userJourneyAccountManagement', ['importSrpHome']],
    ['startupStandardHome', ['startupStandardHome']],
    ['startupPowerUserHome', ['startupPowerUserHome']],
    [
      'interactionUserActions',
      ['loadNewAccount', 'confirmTx', 'bridgeUserActions'],
    ],
  ])('derives %s from the files the runner executes', (preset, expected) => {
    expect(benchmarkNamesForPreset(preset)).toStrictEqual(expected);
  });

  it('overrides the page-load preset, whose key does not follow its filename', () => {
    expect(benchmarkNamesForPreset('pageLoadBenchmark')).toStrictEqual([
      'dappPageLoad',
    ]);
  });

  it('returns nothing for an unknown preset', () => {
    expect(benchmarkNamesForPreset('notAPreset')).toStrictEqual([]);
  });
});

describe('expectedBenchmarkArtifacts', () => {
  const artifacts = expectedBenchmarkArtifacts();

  it('covers every matrix preset on both browsers, plus page-load on chrome only', () => {
    expect(artifacts).toHaveLength(MATRIX_PRESETS.length * 2 + 1);

    const pageLoad = artifacts.filter((a) => a.preset === 'pageLoadBenchmark');
    expect(pageLoad).toHaveLength(1);
    expect(pageLoad[0].browser).toBe('chrome');
    expect(pageLoad[0].artifactName).toBe(
      'benchmark-chrome-webpack-pageLoadBenchmark',
    );
  });

  it('names artifacts the way CI names them', () => {
    expect(artifacts.map((a) => a.artifactName)).toContain(
      'benchmark-firefox-webpack-userJourneyTransactions',
    );
  });

  it('gives every artifact at least one benchmark name', () => {
    for (const artifact of artifacts) {
      expect(artifact.benchmarkNames.length).toBeGreaterThan(0);
    }
  });

  it('draws its presets from the same record the runner uses', () => {
    for (const preset of MATRIX_PRESETS) {
      expect(PRESET_BENCHMARK_FILES[preset]).toBeDefined();
    }
  });
});
