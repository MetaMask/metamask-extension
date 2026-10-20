import type { HostProvenance } from '../../../../shared/constants/benchmarks';
import { provenanceAttributes } from './provenance-attributes';

const statistic = { mean: 1, median: 2, p90: 3 };

describe('provenanceAttributes', () => {
  it('returns nothing when there is no provenance', () => {
    expect(provenanceAttributes()).toStrictEqual({});
  });

  it('flattens host scalars, placement, and calibration', () => {
    const host: HostProvenance = {
      provider: 'namespace',
      label: 'profile',
      cpuCount: 8,
      stealPercent: 0.5,
      placement: { clusterRegion: 'iad2-a' },
      calibration: { sampleCount: 5, metrics: { cpuWorkMs: statistic } },
    };
    expect(provenanceAttributes(host)).toStrictEqual({
      'host.provider': 'namespace',
      'host.label': 'profile',
      'host.cpuCount': 8,
      'host.stealPercent': 0.5,
      'host.placement.clusterRegion': 'iad2-a',
      'host.calibration.sampleCount': 5,
      'host.calibration.cpuWorkMs.mean': 1,
      'host.calibration.cpuWorkMs.median': 2,
      'host.calibration.cpuWorkMs.p90': 3,
    });
  });

  it('flattens tool versions and the calibration browser', () => {
    const host: HostProvenance = {
      nodeVersion: 'v24.13.1',
      anvilVersion: 'anvil 0.3.0',
      calibration: {
        sampleCount: 5,
        metrics: { cpuWorkMs: statistic },
        browser: {
          name: 'chrome',
          version: '126.0.6478.182',
          driverVersion: '126.0.6478.182',
        },
      },
    };
    expect(provenanceAttributes(host)).toMatchObject({
      'host.nodeVersion': 'v24.13.1',
      'host.anvilVersion': 'anvil 0.3.0',
      'host.calibration.browser.name': 'chrome',
      'host.calibration.browser.version': '126.0.6478.182',
      'host.calibration.browser.driverVersion': '126.0.6478.182',
    });
  });

  it('keeps a real zero but omits undefined fields', () => {
    const attributes = provenanceAttributes({
      stealPercent: 0,
      region: undefined,
    });
    expect(attributes).toStrictEqual({ 'host.stealPercent': 0 });
  });

  it('keeps per-runner identifiers out of the attributes', () => {
    const attributes = provenanceAttributes({
      name: 'GitHub Actions 7',
      instanceId: 'abc',
    });
    expect(attributes).toStrictEqual({});
  });

  it('flattens source provenance', () => {
    expect(
      provenanceAttributes(undefined, {
        event: 'pull_request',
        eventSha: 'merge',
        buildFromRun: '123',
      }),
    ).toStrictEqual({
      'source.event': 'pull_request',
      'source.eventSha': 'merge',
      'source.buildFromRun': '123',
    });
  });
});
