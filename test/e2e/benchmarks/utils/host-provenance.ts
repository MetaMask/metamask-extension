import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import os from 'os';
import type { HostProvenance } from '../../../../shared/constants/benchmarks';

/**
 * Fixed work for the CPU probe: hash the same buffer this many times.
 *
 * Set from the probe's own repeatability rather than from a cost target.
 * Measured on a Linux VM, 30 calls per setting:
 *
 *     rounds    mean      CV
 *      2,000     4.1 ms   61.6%
 *     10,000    17.2 ms   16.4%
 *     50,000    84.9 ms    4.2%
 *    200,000   342.7 ms    5.3%
 *
 * The probe exists to tell a slow box from a fast one, and the between-run
 * modes it has to separate sit about 26% apart. At 2,000 rounds the probe's
 * own noise is 61.6% — more than twice the signal — so a single reading
 * could not rank two machines, and the column would have looked like data.
 * The dominant term there is scheduling noise rather than timer granularity.
 *
 * 50,000 is the first setting whose CV is well inside the separation, and
 * 200,000 is worse for four times the cost. Both call sites run during result
 * assembly, after every measurement has completed, so 85 ms is outside
 * anything the benchmark reports.
 */
const CPU_PROBE_ROUNDS = 50000;

/** The buffer the probe hashes. Fixed, so the work is identical everywhere. */
const CPU_PROBE_INPUT = Buffer.alloc(4096, 0x5a);

/**
 * Time a fixed, deterministic, CPU-bound workload.
 *
 * This is the Node-side probe. It measures the speed of the machine the test
 * process runs on, which is what separates "the box was slow" from "the code
 * got slower" when comparing runs across a heterogeneous runner pool.
 *
 * It is NOT the in-page probe: it says nothing about the CPU share the browser
 * received, so a run where the browser was starved while the Node process was
 * not reads as fast here. An in-page probe bracketing each iteration is the
 * stronger measurement and is not implemented yet.
 *
 * Chained rather than independent so the optimizer cannot drop rounds: each
 * digest feeds the next.
 */
export function timeCpuProbe(rounds: number = CPU_PROBE_ROUNDS): number {
  const start = process.hrtime.bigint();
  let digest = CPU_PROBE_INPUT;
  for (let i = 0; i < rounds; i++) {
    digest = createHash('sha256').update(digest).digest();
  }
  const elapsed = Number(process.hrtime.bigint() - start) / 1e6;
  // Read the result so the loop cannot be eliminated as dead.
  return digest.length > 0 ? elapsed : elapsed;
}

/**
 * Cumulative CPU steal, as a percentage of all CPU time since boot.
 *
 * These runners are VMs rather than bare metal, so the guest can be descheduled
 * by the hypervisor while it believes it is running — time that inflates a
 * measurement without appearing in any of the fields above. It is readable from
 * inside the guest: field 8 of the aggregate `cpu` line in `/proc/stat`.
 *
 * Cumulative since boot rather than for the run, so on a long-lived runner it
 * reads low even if this job was starved. It is a coarse indicator, and a
 * per-run delta would be better; that needs a reading at both ends of the run.
 * Returns undefined off Linux and wherever `/proc/stat` cannot be read.
 */
export function readStealPercent(): number | undefined {
  try {
    const line = readFileSync('/proc/stat', 'utf8')
      .split('\n')
      .find((l) => l.startsWith('cpu '));
    if (!line) {
      return undefined;
    }
    const fields = line.trim().split(/\s+/u).slice(1).map(Number);
    if (fields.length < 8 || fields.some((n) => !Number.isFinite(n))) {
      return undefined;
    }
    const total = fields.reduce((acc, n) => acc + n, 0);
    return total > 0 ? (fields[7] / total) * 100 : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Describe the machine this benchmark ran on.
 *
 * Every field is read from the runner itself, so nothing outside this process
 * has to be configured for the common ones. Two caveats worth stating where
 * they are read rather than where they bite:
 *
 * - `region` is not obtainable from the environment on GitHub-hosted runners.
 * The Azure region appears only in the job log's "Set up job" step, so it is
 * left undefined here rather than guessed. Where a provider exposes it, the
 * workflow can pass it through `BENCHMARK_RUNNER_REGION`.
 * - `label` is the `runs-on` value the job requested, which no standard
 * variable carries. The workflow passes it through `BENCHMARK_RUNNER_LABEL`;
 * without that the profile a run used is not recoverable from the artifact.
 */
export function captureHostProvenance(): HostProvenance {
  const cpus = os.cpus();
  const first = cpus[0];

  return {
    label: process.env.BENCHMARK_RUNNER_LABEL,
    name: process.env.RUNNER_NAME,
    region: process.env.BENCHMARK_RUNNER_REGION,
    os: process.env.RUNNER_OS ?? os.platform(),
    arch: process.env.RUNNER_ARCH ?? os.arch(),
    cpuModel: first?.model,
    cpuCount: cpus.length,
    // `os.cpus()[0].speed` reports 0 on Linux VMs rather than being absent,
    // and a 0 MHz CPU is not a reading. Normalised so a consumer does not have
    // to know that one field encodes "unknown" as a number.
    cpuSpeedMhz: first?.speed ? first.speed : undefined,
    totalMemMb: Math.round(os.totalmem() / 1024 / 1024),
    stealPercent: readStealPercent(),
    cpuProbeMs: timeCpuProbe(),
  };
}
