import { availableParallelism } from 'node:os';
import type { RuleSetUseItem } from 'webpack';
import { THREAD_LOADER_PRESETS, type ThreadLoaderPreset } from '../constants';

export type ThreadLoaderConfig = {
  preset: ThreadLoaderPreset;
  /** Override worker count. Takes precedence over preset value. */
  workers?: number;
  /** Override workerParallelJobs. Takes precedence over preset value. */
  jobs?: number;
  watch: boolean;
};

/**
 * Resolves a thread-loader preset to concrete worker/job counts.
 *
 * @param preset - The thread-loader preset name.
 * @returns Worker config, or null if thread-loader should be disabled.
 */
export function resolveThreadLoaderPreset(
  preset: ThreadLoaderPreset,
): { workers: number; workerParallelJobs: number } | null {
  const numCores = availableParallelism();

  switch (preset) {
    case THREAD_LOADER_PRESETS.LIGHT:
      return { workers: 1, workerParallelJobs: 10 };
    case THREAD_LOADER_PRESETS.FULL:
      return { workers: Math.max(1, numCores - 2), workerParallelJobs: 15 };
    case THREAD_LOADER_PRESETS.AUTO:
      return numCores <= 4
        ? resolveThreadLoaderPreset(THREAD_LOADER_PRESETS.LIGHT)
        : resolveThreadLoaderPreset(THREAD_LOADER_PRESETS.FULL);
    case THREAD_LOADER_PRESETS.OFF:
      return null;
    default:
      return null;
  }
}

/**
 * Get thread-loader configuration for parallelizing webpack loaders.
 *
 * @param config - Thread-loader options including preset and overrides.
 * @returns A thread-loader `RuleSetUseItem`, or `null` when disabled.
 */
export function getThreadLoader(
  config: ThreadLoaderConfig,
): RuleSetUseItem | null {
  const {
    preset,
    workers: workersOverride,
    jobs: jobsOverride,
    watch,
  } = config;
  const resolved = resolveThreadLoaderPreset(preset);

  if (!resolved) {
    return null;
  }

  return {
    loader: 'thread-loader',
    options: {
      workers:
        workersOverride === undefined ? resolved.workers : workersOverride,
      workerParallelJobs:
        jobsOverride === undefined ? resolved.workerParallelJobs : jobsOverride,
      poolTimeout: watch ? Number(Infinity) : 2000,
    },
  };
}
