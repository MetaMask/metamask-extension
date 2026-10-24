import { captureHostProvenance, timeCpuProbe } from './host-provenance';

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
