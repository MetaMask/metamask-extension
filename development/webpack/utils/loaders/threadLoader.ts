import { availableParallelism, arch, freemem } from 'node:os';
import type { RuleSetUseItem } from 'webpack';

export type ThreadLoaderConfig = {
  threads: number | 'auto';
  jobsPerThread: number | 'auto';
  watch: boolean;
};

/**
 * Resolves the worker count when `threads` is set to `'auto'`.
 *
 * Uses `availableParallelism()` for core count and `freemem()` to cap workers
 * so they don't exhaust available memory (prevents pagefile thrashing on
 * memory-constrained machines).
 *
 * @returns The resolved number of workers (always >= 1).
 */
// TODO: Implement smarter memory-aware detection based on actual file count
// and per-file memory cost. Current heuristic uses a fixed estimate.
export function resolveAutoThreads(): number {
  // TODO: this architecture split seems to work right now, but come back to it when we have more data
  const ESTIMATED_WORKER_MEMORY_MB = arch() === 'x64' ? 750 : 250;
  const MEMORY_BUDGET_RATIO = 0.5;

  const numCores = availableParallelism();
  const coreBasedWorkers = Math.max(1, numCores - 2);

  const memBasedWorkers = Math.floor(
    (getAvailableMemoryMB() * MEMORY_BUDGET_RATIO) / ESTIMATED_WORKER_MEMORY_MB,
  );

  return Math.max(1, Math.min(coreBasedWorkers, memBasedWorkers));
}

export function getAvailableMemoryMB(): number {
  return freemem() / (1024 * 1024);
}

/** Default `workerParallelJobs` when `jobsPerThread` is `'auto'`. */
export const DEFAULT_JOBS_PER_THREAD = 15;

/**
 * Get thread-loader configuration for parallelizing webpack loaders.
 *
 * @param config - Thread-loader options including thread/job counts and watch mode.
 * @returns A thread-loader `RuleSetUseItem`, or `null` when disabled.
 */
export function getThreadLoader(
  config: ThreadLoaderConfig,
): RuleSetUseItem | null {
  const { threads, jobsPerThread, watch } = config;

  if (threads === 0) {
    return null;
  }

  const resolvedThreads = threads === 'auto' ? resolveAutoThreads() : threads;
  const resolvedJobs =
    jobsPerThread === 'auto' ? DEFAULT_JOBS_PER_THREAD : jobsPerThread;

  return {
    loader: 'thread-loader',
    options: {
      workers: resolvedThreads,
      workerParallelJobs: resolvedJobs,
      poolTimeout: watch ? Number(Infinity) : 2000,
    },
  };
}
