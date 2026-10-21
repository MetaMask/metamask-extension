import type {
  HostProvenance,
  SourceProvenance,
} from '../../../../shared/constants/benchmarks';

type Attributes = Record<string, string | number>;

// `name`, `instanceId` and `capturedAt` stay in the artifact only: they are
// unique per runner or result, so they would make every log a distinct series.
const HOST_SCALAR_KEYS = [
  'provider',
  'label',
  'shape',
  'region',
  'os',
  'arch',
  'imageOs',
  'imageVersion',
  'cpuModel',
  'cpuFamily',
  'cpuModelNumber',
  'cpuStepping',
  'cpuMicrocode',
  'nodeVersion',
  'anvilVersion',
  'cpuCount',
  'cpuSpeedMhz',
  'totalMemMb',
  'stealPercent',
  'nodeProbeBeforeMs',
  'nodeProbeAfterMs',
] as const;

const SOURCE_KEYS = [
  'event',
  'eventSha',
  'headSha',
  'baseSha',
  'buildFromRun',
  'buildFromSha',
  'buildSourceHash',
] as const;

function addIfDefined(out: Attributes, key: string, value: unknown): void {
  if (typeof value === 'string' || typeof value === 'number') {
    out[key] = value;
  }
}

/**
 * Flatten one result's host and source provenance into Sentry attributes.
 *
 * Undefined fields are omitted rather than sent as placeholders, so an absent
 * attribute means "unknown" instead of looking like a value.
 *
 * @param host - The result's host provenance.
 * @param source - The result's source provenance.
 * @returns Attributes to merge into every emission for that result.
 */
export function provenanceAttributes(
  host?: HostProvenance,
  source?: SourceProvenance,
): Attributes {
  const out: Attributes = {};

  if (host) {
    for (const key of HOST_SCALAR_KEYS) {
      addIfDefined(out, `host.${key}`, host[key]);
    }
    for (const [key, value] of Object.entries(host.placement ?? {})) {
      addIfDefined(out, `host.placement.${key}`, value);
    }
    if (host.calibration) {
      addIfDefined(
        out,
        'host.calibration.sampleCount',
        host.calibration.sampleCount,
      );
      for (const [key, value] of Object.entries(
        host.calibration.browser ?? {},
      )) {
        addIfDefined(out, `host.calibration.browser.${key}`, value);
      }
      for (const [metric, statistic] of Object.entries(
        host.calibration.metrics,
      )) {
        addIfDefined(out, `host.calibration.${metric}.mean`, statistic.mean);
        addIfDefined(
          out,
          `host.calibration.${metric}.median`,
          statistic.median,
        );
        addIfDefined(out, `host.calibration.${metric}.p90`, statistic.p90);
      }
    }
  }

  if (source) {
    for (const key of SOURCE_KEYS) {
      addIfDefined(out, `source.${key}`, source[key]);
    }
  }

  return out;
}
