import {
  captureHostProvenance,
  markBenchmarkWindowStart,
  medianCpuProbe,
  parseCalibration,
  parseCpuTimes,
  parseSetupInfoRegion,
  stealPercentBetween,
  timeCpuProbe,
} from './host-provenance';

const statistic = { mean: 1, median: 2, p90: 3 };

describe('timeCpuProbe', () => {
  it('returns a positive duration', () => {
    expect(timeCpuProbe(50)).toBeGreaterThan(0);
  });

  it('scales with the work it is given', () => {
    expect(timeCpuProbe(5000)).toBeGreaterThan(timeCpuProbe(100));
  });
});

describe('medianCpuProbe', () => {
  it('returns a positive duration', () => {
    expect(medianCpuProbe(3, 50)).toBeGreaterThan(0);
  });
});

describe('parseCpuTimes', () => {
  it('sums the first eight fields and reads steal from the eighth', () => {
    const stat = 'cpu  10 20 30 40 50 60 70 80 900 1000\ncpu0 1 2 3 4 5 6 7 8';
    expect(parseCpuTimes(stat)).toStrictEqual({ steal: 80, total: 360 });
  });

  it('returns undefined without an aggregate cpu line', () => {
    expect(parseCpuTimes('intr 1 2 3')).toBeUndefined();
  });

  it('returns undefined when a field is not numeric', () => {
    expect(parseCpuTimes('cpu  1 2 3 4 5 6 7 x')).toBeUndefined();
  });

  it('returns undefined when fields are missing', () => {
    expect(parseCpuTimes('cpu  1 2 3')).toBeUndefined();
  });
});

describe('stealPercentBetween', () => {
  it('reports steal over the window, not since boot', () => {
    const start = { steal: 100, total: 1000 };
    const end = { steal: 110, total: 1100 };
    expect(stealPercentBetween(start, end)).toBe(10);
  });

  it('returns undefined when a reading is missing', () => {
    expect(stealPercentBetween(undefined, { steal: 1, total: 2 })).toBe(
      undefined,
    );
    expect(stealPercentBetween({ steal: 1, total: 2 }, undefined)).toBe(
      undefined,
    );
  });

  it('returns undefined when no CPU time elapsed', () => {
    const reading = { steal: 5, total: 50 };
    expect(stealPercentBetween(reading, reading)).toBeUndefined();
  });

  it('returns undefined when the steal counter went backwards', () => {
    const start = { steal: 10, total: 100 };
    expect(stealPercentBetween(start, { steal: 5, total: 200 })).toBe(
      undefined,
    );
  });
});

describe('parseCalibration', () => {
  const metrics = {
    cpuWorkMs: statistic,
    scriptStartMs: statistic,
    navigationLoadMs: statistic,
    longTaskTotalDurationMs: statistic,
    tbtMs: statistic,
  };

  it('keeps only the metrics that carry signal', () => {
    expect(parseCalibration({ sampleCount: 5, metrics })).toStrictEqual({
      sampleCount: 5,
      metrics: {
        cpuWorkMs: statistic,
        scriptStartMs: statistic,
        navigationLoadMs: statistic,
      },
    });
  });

  it('rejects a metric with a non-finite value', () => {
    const broken = { ...metrics, cpuWorkMs: { ...statistic, p90: NaN } };
    expect(parseCalibration({ sampleCount: 5, metrics: broken })).toBe(
      undefined,
    );
  });

  it('rejects a missing metric', () => {
    const { cpuWorkMs, ...rest } = metrics;
    expect(parseCalibration({ sampleCount: 5, metrics: rest })).toBe(undefined);
  });

  it('rejects input that is not an object', () => {
    expect(parseCalibration(undefined)).toBeUndefined();
    expect(parseCalibration(null)).toBeUndefined();
    expect(parseCalibration('x')).toBeUndefined();
  });

  it('rejects a non-numeric sample count', () => {
    expect(parseCalibration({ sampleCount: 'x', metrics })).toBeUndefined();
  });

  it('carries the browser the calibration launched', () => {
    const browser = {
      name: 'firefox',
      version: '131.0',
      driverVersion: '0.36.0',
      extra: 1,
    };
    expect(
      parseCalibration({ sampleCount: 5, metrics, browser })?.browser,
    ).toEqual({ name: 'firefox', version: '131.0', driverVersion: '0.36.0' });
  });

  it('omits the browser when it has no usable fields', () => {
    const browser = { name: 3, version: '' };
    expect(
      parseCalibration({ sampleCount: 5, metrics, browser })?.browser,
    ).toBeUndefined();
  });
});

describe('parseSetupInfoRegion', () => {
  const provisioner = {
    Group: 'Runner Image Provisioner',
    Detail:
      'Hosted Compute Agent\nVersion: 20261015.610\nWorker ID: {642f}\nRegion: eastus\nCloud: Azure',
  };

  it('reads the region from the provisioner entry', () => {
    const image = { Group: 'Operating System', Detail: 'Ubuntu\n24.04.3' };
    expect(parseSetupInfoRegion([image, provisioner])).toBe('eastus');
  });

  it('returns undefined when no entry has a region', () => {
    expect(
      parseSetupInfoRegion([{ Group: 'Image', Detail: 'Version: 1' }]),
    ).toBeUndefined();
  });

  it('returns undefined for unexpected shapes', () => {
    expect(parseSetupInfoRegion({})).toBeUndefined();
    expect(parseSetupInfoRegion([null, { Detail: 5 }])).toBeUndefined();
  });
});

describe('captureHostProvenance', () => {
  it('reads GitHub identity from the environment', () => {
    const host = captureHostProvenance({
      GITHUB_ACTIONS: 'true',
      BENCHMARK_RUNNER_LABEL: 'ubuntu-latest',
      RUNNER_NAME: 'GitHub Actions 1',
      RUNNER_OS: 'Linux',
      ImageOS: 'ubuntu24',
      ImageVersion: '20261001.1.0',
      BENCHMARK_RUNNER_REGION: 'eastus',
    });
    expect(host).toMatchObject({
      provider: 'github',
      label: 'ubuntu-latest',
      name: 'GitHub Actions 1',
      os: 'Linux',
      imageOs: 'ubuntu24',
      imageVersion: '20261001.1.0',
      region: 'eastus',
    });
    expect(host.placement).toBeUndefined();
  });

  it('reads Namespace identity and placement from the environment', () => {
    const host = captureHostProvenance({
      NSC_INSTANCE_ID: 'abc',
      NSC_INSTANCE_SHAPE: '8x16',
      BENCHMARK_RUNNER_LABEL: 'namespace-profile-metamask-ci-linux',
      NSC_STORAGE_ENDPOINT: 'https://iad2.example.com/path',
      NSC_ENDPOINT: 'https://api.iad2-a.example.com',
      NAMESPACE_ACTIONS_RESULTS_URL: 'https://results.ord.example.com',
    });
    expect(host).toMatchObject({
      provider: 'namespace',
      instanceId: 'abc',
      shape: '8x16',
      placement: {
        storageRegion: 'iad2',
        clusterRegion: 'iad2-a',
        actionsResultsRegion: 'ord',
      },
    });
  });

  it('prefers Namespace when both signals are present', () => {
    const host = captureHostProvenance({
      GITHUB_ACTIONS: 'true',
      NSC_INSTANCE_ID: 'abc',
    });
    expect(host.provider).toBe('namespace');
  });

  it('stamps the capture time as ISO 8601 UTC', () => {
    const before = Date.now();
    const { capturedAt } = captureHostProvenance({});
    expect(capturedAt).toMatch(/^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/u);
    expect(Date.parse(capturedAt as string)).toBeGreaterThanOrEqual(before);
  });

  it('leaves the provider undefined outside CI', () => {
    expect(captureHostProvenance({}).provider).toBeUndefined();
  });

  it('treats empty variables as unknown, not as values', () => {
    const host = captureHostProvenance({
      BENCHMARK_RUNNER_LABEL: '',
      ImageVersion: '',
    });
    expect(host.label).toBeUndefined();
    expect(host.imageVersion).toBeUndefined();
  });

  it('describes the machine without configuration', () => {
    const host = captureHostProvenance({});
    expect(host.cpuCount).toBeGreaterThan(0);
    expect(typeof host.cpuModel).toBe('string');
    expect(host.totalMemMb).toBeGreaterThan(0);
    expect(host.nodeProbeAfterMs).toBeGreaterThan(0);
  });

  it('reports a CPU speed or nothing, never zero', () => {
    const { cpuSpeedMhz } = captureHostProvenance({});
    if (cpuSpeedMhz !== undefined) {
      expect(cpuSpeedMhz).toBeGreaterThan(0);
    }
  });

  it('reports steal as a percentage or not at all', () => {
    const { stealPercent } = captureHostProvenance({});
    if (stealPercent !== undefined) {
      expect(stealPercent).toBeGreaterThanOrEqual(0);
      expect(stealPercent).toBeLessThanOrEqual(100);
    }
  });

  it('records a before probe only after the window was marked', () => {
    markBenchmarkWindowStart();
    expect(captureHostProvenance({}).nodeProbeBeforeMs).toBeGreaterThan(0);
  });

  it('omits calibration when no file is configured', () => {
    expect(captureHostProvenance({}).calibration).toBeUndefined();
  });

  it('omits calibration when the configured file is unreadable', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation();
    const host = captureHostProvenance({
      BENCHMARK_CALIBRATION_FILE: '/nonexistent/calibration.json',
    });
    expect(host.calibration).toBeUndefined();
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });
});
