import { createHash } from 'crypto';
import { readdirSync, readFileSync } from 'fs';
import os from 'os';
import type {
  CalibrationStatistic,
  HostCalibration,
  HostProvenance,
} from '../../../../shared/constants/benchmarks';

/**
 * Fixed work for the Node-process CPU probe: hash one buffer this many times.
 *
 * About 85 ms on the Linux VM it was tuned on. 2,000 rounds was far too noisy
 * there to rank two machines (CV 46-62%). Revalidate on the runner pools
 * before relying on the absolute values.
 */
const CPU_PROBE_ROUNDS = 50000;

/** Odd, so the median is one of the samples. */
const CPU_PROBE_REPEATS = 3;

const CPU_PROBE_INPUT = Buffer.alloc(4096, 0x5a);

/** In-browser calibration metrics worth carrying on a result. */
const CALIBRATION_METRICS = ['cpuWorkMs', 'scriptStartMs', 'navigationLoadMs'];

/**
 * Time a fixed, chained, CPU-bound workload in the Node process.
 *
 * It ranks the machines the test process runs on. It cannot see the CPU share
 * the browser received, which is what the in-browser calibration measures.
 *
 * @param rounds - Number of chained sha256 digests to compute.
 * @returns Elapsed milliseconds.
 */
export function timeCpuProbe(rounds: number = CPU_PROBE_ROUNDS): number {
  const start = process.hrtime.bigint();
  let digest: Buffer = CPU_PROBE_INPUT;
  for (let i = 0; i < rounds; i += 1) {
    digest = createHash('sha256').update(digest).digest();
  }
  return Number(process.hrtime.bigint() - start) / 1e6;
}

/**
 * Median of several probes; a single reading is too noisy to compare.
 *
 * @param repeats - Number of probes. Use an odd number.
 * @param rounds - Rounds per probe.
 * @returns Median elapsed milliseconds.
 */
export function medianCpuProbe(
  repeats: number = CPU_PROBE_REPEATS,
  rounds: number = CPU_PROBE_ROUNDS,
): number {
  const samples = Array.from({ length: repeats }, () => timeCpuProbe(rounds));
  samples.sort((a, b) => a - b);
  return samples[Math.floor(samples.length / 2)];
}

export type CpuTimes = { steal: number; total: number };

/**
 * Parse the aggregate `cpu` line of `/proc/stat`.
 *
 * @param stat - Contents of `/proc/stat`.
 * @returns Cumulative steal and total CPU ticks, or undefined if unreadable.
 */
export function parseCpuTimes(stat: string): CpuTimes | undefined {
  const line = stat.split('\n').find((l) => l.startsWith('cpu '));
  if (!line) {
    return undefined;
  }
  // user nice system idle iowait irq softirq steal. guest and guest_nice are
  // already counted inside user and nice, so adding them would count that time
  // twice.
  const fields = line.trim().split(/\s+/u).slice(1, 9).map(Number);
  if (fields.length < 8 || fields.some((n) => !Number.isFinite(n))) {
    return undefined;
  }
  return { steal: fields[7], total: fields.reduce((sum, n) => sum + n, 0) };
}

function readCpuTimes(): CpuTimes | undefined {
  try {
    return parseCpuTimes(readFileSync('/proc/stat', 'utf8'));
  } catch {
    return undefined;
  }
}

/**
 * Steal as a percentage of CPU time between two readings.
 *
 * The counters are cumulative since boot, so only a delta describes the window
 * that was measured.
 *
 * @param start - Reading at the start of the window.
 * @param end - Reading at the end of the window.
 * @returns Percentage, or undefined if either reading is missing or no CPU
 * time elapsed.
 */
export function stealPercentBetween(
  start: CpuTimes | undefined,
  end: CpuTimes | undefined,
): number | undefined {
  if (!start || !end) {
    return undefined;
  }
  const total = end.total - start.total;
  const steal = end.steal - start.steal;
  if (total <= 0 || steal < 0) {
    return undefined;
  }
  return (steal / total) * 100;
}

type BenchmarkWindow = { cpu?: CpuTimes; nodeProbeBeforeMs?: number };

// Until a benchmark marks its own start, the window opens when this module
// loads. A result captured that way has steal but no "before" probe.
let benchmarkWindow: BenchmarkWindow = { cpu: readCpuTimes() };

/**
 * Open a measurement window: run the before probe, then read the CPU counters.
 * Benchmarks in one process run sequentially, so the latest mark belongs to
 * the result captured next.
 */
export function markBenchmarkWindowStart(): void {
  const nodeProbeBeforeMs = medianCpuProbe();
  benchmarkWindow = { cpu: readCpuTimes(), nodeProbeBeforeMs };
}

function nonEmpty(value: string | undefined): string | undefined {
  return value || undefined;
}

function hostnameLabel(
  value: string | undefined,
  labelIndex: number,
): string | undefined {
  if (!value) {
    return undefined;
  }
  try {
    return nonEmpty(new URL(value).hostname.split('.')[labelIndex]);
  } catch {
    return undefined;
  }
}

function namespacePlacement(
  env: NodeJS.ProcessEnv,
): Record<string, string> | undefined {
  const entries = Object.entries({
    storageRegion: hostnameLabel(env.NSC_STORAGE_ENDPOINT, 0),
    clusterRegion: hostnameLabel(env.NSC_ENDPOINT, 1),
    actionsResultsRegion: hostnameLabel(env.NAMESPACE_ACTIONS_RESULTS_URL, 1),
  }).filter((entry): entry is [string, string] => entry[1] !== undefined);
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function isFiniteStatistic(value: unknown): value is CalibrationStatistic {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const { mean, median, p90 } = value as Record<string, unknown>;
  return [mean, median, p90].every(
    (n) => typeof n === 'number' && Number.isFinite(n),
  );
}

/**
 * Reduce a calibration artifact to the summary a result carries.
 *
 * Long-task and blocking-time fields are dropped: they are always zero in the
 * headless fixture, so carrying them would read as a measurement.
 *
 * @param json - Parsed `runner-calibration-*.json`.
 * @returns The summary, or undefined if the shape is not recognized.
 */
export function parseCalibration(json: unknown): HostCalibration | undefined {
  if (typeof json !== 'object' || json === null) {
    return undefined;
  }
  const { sampleCount, metrics } = json as Record<string, unknown>;
  if (typeof sampleCount !== 'number' || typeof metrics !== 'object') {
    return undefined;
  }
  const kept: Record<string, CalibrationStatistic> = {};
  for (const name of CALIBRATION_METRICS) {
    const statistic = (metrics as Record<string, unknown> | null)?.[name];
    if (!isFiniteStatistic(statistic)) {
      return undefined;
    }
    kept[name] = {
      mean: statistic.mean,
      median: statistic.median,
      p90: statistic.p90,
    };
  }
  return { sampleCount, metrics: kept };
}

function readCalibration(
  filePath: string | undefined,
): HostCalibration | undefined {
  if (!filePath) {
    return undefined;
  }
  try {
    const calibration = parseCalibration(
      JSON.parse(readFileSync(filePath, 'utf8')),
    );
    if (!calibration) {
      console.warn(`Calibration file has an unexpected shape: ${filePath}`);
    }
    return calibration;
  } catch (error) {
    console.warn(`Unable to read calibration file ${filePath}:`, error);
    return undefined;
  }
}

/**
 * Pull the region out of the `.setup_info` JSON that GitHub's provisioner
 * writes next to the runner, e.g. `...\nRegion: eastus\nCloud: Azure`.
 *
 * @param json - Parsed `.setup_info` content.
 * @returns The region, or undefined if no entry carries one.
 */
export function parseSetupInfoRegion(json: unknown): string | undefined {
  if (!Array.isArray(json)) {
    return undefined;
  }
  for (const entry of json) {
    const detail = (entry as Record<string, unknown> | null)?.Detail;
    const match =
      typeof detail === 'string' ? /^Region:\s*(\S+)\s*$/mu.exec(detail) : null;
    if (match) {
      return match[1];
    }
  }
  return undefined;
}

function readHostedRegion(
  runnersDir: string = '/home/runner/actions-runner/cached',
): string | undefined {
  try {
    for (const version of readdirSync(runnersDir)) {
      const region = parseSetupInfoRegion(
        JSON.parse(
          readFileSync(`${runnersDir}/${version}/.setup_info`, 'utf8'),
        ),
      );
      if (region) {
        return region;
      }
    }
  } catch {
    // Not a hosted runner, or the provisioner layout changed.
  }
  return undefined;
}

function detectProvider(env: NodeJS.ProcessEnv): HostProvenance['provider'] {
  if (env.NSC_INSTANCE_ID) {
    return 'namespace';
  }
  return env.GITHUB_ACTIONS === 'true' ? 'github' : undefined;
}

/**
 * Describe the machine, and the window since the last mark, for one result.
 *
 * Call it right after the measurements finish: it ends the steal window and
 * takes the after probe. Fields the provider does not expose stay undefined.
 *
 * @param env - Environment to read; defaults to the process environment.
 * @returns Host provenance for the result being assembled.
 */
export function captureHostProvenance(
  env: NodeJS.ProcessEnv = process.env,
): HostProvenance {
  const cpus = os.cpus();
  const [first] = cpus;
  const stealPercent = stealPercentBetween(benchmarkWindow.cpu, readCpuTimes());
  const nodeProbeAfterMs = medianCpuProbe();
  const provider = detectProvider(env);

  return {
    provider,
    label: nonEmpty(env.BENCHMARK_RUNNER_LABEL),
    name: nonEmpty(env.RUNNER_NAME),
    instanceId: nonEmpty(env.NSC_INSTANCE_ID),
    shape: nonEmpty(env.NSC_INSTANCE_SHAPE),
    region:
      nonEmpty(env.BENCHMARK_RUNNER_REGION) ??
      (provider === 'github' ? readHostedRegion() : undefined),
    placement: provider === 'namespace' ? namespacePlacement(env) : undefined,
    os: nonEmpty(env.RUNNER_OS) ?? os.platform(),
    arch: nonEmpty(env.RUNNER_ARCH) ?? os.arch(),
    imageOs: nonEmpty(env.ImageOS),
    imageVersion: nonEmpty(env.ImageVersion),
    cpuModel: first?.model,
    cpuCount: cpus.length,
    // `os.cpus()[0].speed` is 0 on Linux VMs; 0 MHz is not a reading.
    cpuSpeedMhz: first?.speed ? first.speed : undefined,
    totalMemMb: Math.round(os.totalmem() / 1024 / 1024),
    stealPercent,
    nodeProbeBeforeMs: benchmarkWindow.nodeProbeBeforeMs,
    nodeProbeAfterMs,
    calibration: readCalibration(env.BENCHMARK_CALIBRATION_FILE),
  };
}
