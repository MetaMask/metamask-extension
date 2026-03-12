import { availableParallelism, freemem } from 'node:os';
import type { RuleSetUseItem } from 'webpack';

const ESTIMATED_WORKER_MEMORY_MB = 250;
const MEMORY_BUDGET_RATIO = 0.5;

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
  const numCores = availableParallelism();
  const coreBasedWorkers = numCores <= 4 ? 1 : numCores - 2;

  const availableMemMB = freemem() / (1024 * 1024);
  const memBasedWorkers = Math.floor(
    (availableMemMB * MEMORY_BUDGET_RATIO) / ESTIMATED_WORKER_MEMORY_MB,
  );

  return Math.max(1, Math.min(coreBasedWorkers, memBasedWorkers));
}

/**
 * Resolves `workerParallelJobs` when `jobsPerThread` is set to `'auto'`.
 *
 * @param threads - The resolved thread count.
 * @returns The number of parallel jobs per worker thread.
 */
export function resolveAutoJobs(threads: number): number {
  return threads <= 1 ? 10 : 15;
}

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
    jobsPerThread === 'auto' ? resolveAutoJobs(resolvedThreads) : jobsPerThread;

  return {
    loader: 'thread-loader',
    options: {
      workers: resolvedThreads,
      workerParallelJobs: resolvedJobs,
      poolTimeout: watch ? Number(Infinity) : 2000,
    },
  };
}
