import { availableParallelism } from 'node:os';
import type { RuleSetUseItem } from 'webpack';
import {
  reactCompilerLoader,
  type ReactCompilerLoaderOption,
  defineReactCompilerLoaderOption,
} from 'react-compiler-webpack';
import { THREAD_LOADER_PRESETS, type ThreadLoaderPreset } from '../constants';

/**
 * Resolve the wrapper loader path.
 * Uses require.resolve for consistent module resolution regardless of build context.
 */
const getWrapperPath = () => require.resolve('./reactCompilerLoaderWrapper');

/**
 * React Compiler result status stored in module.buildMeta.
 * This allows statistics to be collected from all modules after compilation,
 * even when using thread-loader (which runs loaders in separate worker threads).
 */
export type ReactCompilerStatus =
  | 'compiled'
  | 'skipped'
  | 'error'
  | 'unsupported';

// Key for storing react compiler status in buildMeta
// Must match the key in reactCompilerLoaderWrapper.cjs
export const REACT_COMPILER_STATUS_KEY = '__reactCompilerStatus__';

/**
 * Statistics collected from module buildMeta after compilation.
 */
export type ReactCompilerStats = {
  compiled: number;
  skipped: number;
  errors: number;
  unsupported: number;
  total: number;
  compiledFiles: string[];
  skippedFiles: string[];
  errorFiles: string[];
  unsupportedFiles: string[];
};

export type ReactCompilerLoaderConfig = {
  target: ReactCompilerLoaderOption['target'];
  verbose: boolean;
  debug: 'all' | 'critical' | 'none';
  /**
   * Thread-loader parallelization preset.
   * 'off' is required when generating LavaMoat policies (static analysis needs full module graph).
   * Note: When verbose is true, the wrapper is still used for logging even without thread-loader.
   */
  threadLoader: ThreadLoaderPreset;
  /** Override worker count. Takes precedence over preset when thread-loader is enabled. */
  threadLoaderWorkers?: number;
  /** Override workerParallelJobs. Takes precedence over preset when thread-loader is enabled. */
  threadLoaderJobs?: number;
  watch: boolean;
};

/**
 * Resolves a thread-loader preset to concrete worker/job counts.
 *
 * @param preset - The thread-loader preset name.
 * @returns Worker config, or null if thread-loader should be disabled.
 */
function resolveThreadLoaderPreset(
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
 * Get the React Compiler loader configuration as an array of loaders.
 * Includes thread-loader for parallelization when enabled.
 *
 * @param config - Configuration options for the React Compiler loader.
 * @returns Array of loader configurations (thread-loader + react compiler loader).
 */
export const getReactCompilerLoader = (
  config: ReactCompilerLoaderConfig,
): RuleSetUseItem[] => {
  const {
    target,
    verbose,
    debug,
    watch,
    threadLoader: preset,
    threadLoaderWorkers: workersOverride,
    threadLoaderJobs: jobsOverride,
  } = config;

  const reactCompilerOptions = {
    target,
    panicThreshold: debug === 'none' ? undefined : `${debug}_errors`,
  } as const satisfies ReactCompilerLoaderOption;

  const loaders: RuleSetUseItem[] = [];
  const threadConfig = resolveThreadLoaderPreset(preset);

  if (threadConfig) {
    const workers =
      workersOverride === undefined ? threadConfig.workers : workersOverride;
    const workerParallelJobs =
      jobsOverride === undefined
        ? threadConfig.workerParallelJobs
        : jobsOverride;
    loaders.push({
      loader: 'thread-loader',
      options: {
        workers,
        workerParallelJobs,
        poolTimeout: watch ? Number(Infinity) : 2000,
      },
    });
  }

  // Use wrapper when:
  // - thread-loader is enabled (for buildMeta tracking in workers)
  // - verbose mode is enabled (wrapper provides logging via logger callback)
  // Skip wrapper only for policy generation (not resolvable under LavaMoat)
  const useWrapper = threadConfig === null ? verbose : true;

  if (useWrapper) {
    loaders.push({
      loader: getWrapperPath(),
      options: {
        ...defineReactCompilerLoaderOption(reactCompilerOptions),
        // eslint-disable-next-line @typescript-eslint/naming-convention
        __verbose: verbose,
      },
    });
  } else {
    // Direct loader without wrapper (for policy generation only)
    loaders.push({
      loader: reactCompilerLoader,
      options: defineReactCompilerLoaderOption(reactCompilerOptions),
    });
  }

  return loaders;
};
