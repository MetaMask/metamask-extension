import { availableParallelism } from 'node:os';
import type { RuleSetUseItem } from 'webpack';
import {
  reactCompilerLoader,
  type ReactCompilerLoaderOption,
  defineReactCompilerLoaderOption,
} from 'react-compiler-webpack';

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
   * Disable thread-loader parallelization.
   * Required when generating LavaMoat policies (static analysis needs full module graph).
   * Note: When verbose is true, the wrapper is still used for logging even without thread-loader.
   */
  disableThreadLoader: boolean;
  watch: boolean;
};

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
  const { target, verbose, debug, watch, disableThreadLoader } = config;

  const reactCompilerOptions = {
    target,
    panicThreshold: debug === 'none' ? undefined : `${debug}_errors`,
  } as const satisfies ReactCompilerLoaderOption;

  const loaders: RuleSetUseItem[] = [];

  const numCores = availableParallelism();
  // Add thread-loader for parallelization when enabled
  // Add thread-loader for parallelization when enabled
  if (!disableThreadLoader) {
    const numCores = availableParallelism();
    loaders.push({
      loader: 'thread-loader',
      options: {
        // Leave reserve for `swc-loader` etc
        workers: Math.max(1, numCores - 2),
        workerParallelJobs: 50,
        poolTimeout: watch ? Number(Infinity) : 500,
      },
    });
  }

  // Use wrapper when:
  // - thread-loader is enabled (for buildMeta tracking in workers)
  // - verbose mode is enabled (wrapper provides logging via logger callback)
  // Skip wrapper only for policy generation (not resolvable under LavaMoat)
  const useWrapper = !disableThreadLoader || verbose;

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
