import {
  captureHostProvenance,
  readBrowserSession,
  recordBrowserSession,
  resetBrowserSession,
  timeCpuProbe,
} from './host-provenance';

describe('timeCpuProbe', () => {
  it('returns a positive duration', () => {
    expect(timeCpuProbe(50)).toBeGreaterThan(0);
  });

  it('scales with the work it is given', () => {
    // Ten times the rounds should cost materially more. Loose bound: CI boxes
    // are noisy and the point is that the loop is not elided, not the ratio.
    const small = timeCpuProbe(50);
    const large = timeCpuProbe(500);
    expect(large).toBeGreaterThan(small);
  });
});

describe('captureHostProvenance', () => {
  const env = process.env;

  afterEach(() => {
    process.env = env;
  });

  it('reads the profile and region the workflow passes', () => {
    process.env = {
      ...env,
      BENCHMARK_RUNNER_LABEL: 'namespace-profile-metamask-ci-linux',
      BENCHMARK_RUNNER_REGION: 'us-east-1a',
    };
    const host = captureHostProvenance();
    expect(host.label).toBe('namespace-profile-metamask-ci-linux');
    expect(host.region).toBe('us-east-1a');
  });

  it('leaves the profile undefined rather than guessing it', () => {
    const { BENCHMARK_RUNNER_LABEL, ...rest } = env;
    process.env = rest;
    expect(captureHostProvenance().label).toBeUndefined();
  });

  it('describes the machine without anything being configured', () => {
    const host = captureHostProvenance();
    expect(host.cpuCount).toBeGreaterThan(0);
    expect(typeof host.cpuModel).toBe('string');
    expect(host.totalMemMb).toBeGreaterThan(0);
    expect(host.cpuProbeMs).toBeGreaterThan(0);
  });

  it('reports a CPU speed or nothing, never a zero', () => {
    // `os.cpus()[0].speed` is 0 on Linux VMs rather than absent, and a 0 MHz
    // CPU is not a reading. A consumer should not have to know that one field
    // encodes "unknown" as a number.
    const { cpuSpeedMhz } = captureHostProvenance();
    if (cpuSpeedMhz !== undefined) {
      expect(cpuSpeedMhz).toBeGreaterThan(0);
    }
  });

  it('runs the probe long enough to rank two machines', () => {
    // The probe exists to separate a slow box from a fast one, and the modes
    // it has to tell apart sit about 26% apart. At the original 2,000 rounds
    // its own CV was 61.6%, so one reading could not rank anything. This
    // asserts the cost that buys the repeatability rather than the CV itself,
    // which would need 30 calls and make the suite slow.
    const { cpuProbeMs } = captureHostProvenance();
    expect(cpuProbeMs).toBeGreaterThan(10);
  });

  it('reports steal as a percentage or not at all', () => {
    const { stealPercent } = captureHostProvenance();
    if (stealPercent !== undefined) {
      expect(stealPercent).toBeGreaterThanOrEqual(0);
      expect(stealPercent).toBeLessThanOrEqual(100);
    }
  });
});

describe('runner image and environment', () => {
  const { env } = process;

  afterEach(() => {
    process.env = env;
  });

  it('reads the image and environment GitHub sets', () => {
    process.env = {
      ...env,
      ImageOS: 'ubuntu24',
      ImageVersion: '20260101.1.0',
      RUNNER_ENVIRONMENT: 'github-hosted',
      HEAD_COMMIT_HASH: 'abc123',
    };
    expect(captureHostProvenance()).toMatchObject({
      imageOs: 'ubuntu24',
      imageVersion: '20260101.1.0',
      runnerEnvironment: 'github-hosted',
      commitHash: 'abc123',
    });
  });

  it('records null for what the environment does not set', () => {
    const {
      ImageOS,
      ImageVersion,
      RUNNER_ENVIRONMENT,
      HEAD_COMMIT_HASH,
      ...rest
    } = env;
    process.env = rest;
    expect(captureHostProvenance()).toMatchObject({
      imageOs: null,
      imageVersion: null,
      runnerEnvironment: null,
      commitHash: null,
    });
  });

  it('reads the build-source hash CI computed', () => {
    process.env = { ...env, BUILD_SOURCE_HASH: 'f00dfeed' };
    expect(captureHostProvenance().buildSourceHash).toBe('f00dfeed');
  });

  it('records the build-source hash as null when CI passed none', () => {
    const { BUILD_SOURCE_HASH, ...rest } = env;
    process.env = rest;
    expect(captureHostProvenance().buildSourceHash).toBeNull();
    process.env = { ...rest, BUILD_SOURCE_HASH: '' };
    expect(captureHostProvenance().buildSourceHash).toBeNull();
  });
});

describe('browser session', () => {
  const capabilities = (values: Record<string, unknown>) => ({
    get: (key: string) => values[key],
  });

  afterEach(() => {
    resetBrowserSession();
  });

  it('reads Chrome and chromedriver versions, dropping the revision', () => {
    expect(
      readBrowserSession(
        capabilities({
          browserName: 'chrome',
          browserVersion: '131.0.6778.85',
          chrome: { chromedriverVersion: '131.0.6778.85 (abcdef-refs/x)' },
        }),
      ),
    ).toStrictEqual({
      browserName: 'chrome',
      browserVersion: '131.0.6778.85',
      driverVersion: '131.0.6778.85',
    });
  });

  it('reads Firefox and geckodriver versions', () => {
    expect(
      readBrowserSession(
        capabilities({
          browserName: 'firefox',
          browserVersion: '126.0',
          'moz:geckodriverVersion': '0.36.0',
        }),
      ),
    ).toStrictEqual({
      browserName: 'firefox',
      browserVersion: '126.0',
      driverVersion: '0.36.0',
    });
  });

  it('returns null for capabilities the session does not report', () => {
    expect(readBrowserSession(capabilities({}))).toStrictEqual({
      browserName: null,
      browserVersion: null,
      driverVersion: null,
    });
  });

  it('puts the recorded session into the host record', () => {
    expect(captureHostProvenance().browserVersion).toBeNull();
    recordBrowserSession({
      browserName: 'chrome',
      browserVersion: '131.0.6778.85',
      driverVersion: '131.0.6778.85',
    });
    expect(captureHostProvenance()).toMatchObject({
      browserName: 'chrome',
      browserVersion: '131.0.6778.85',
      driverVersion: '131.0.6778.85',
    });
  });
});
