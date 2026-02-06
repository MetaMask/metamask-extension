import { availableParallelism } from 'node:os';
import { join, sep } from 'node:path';
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
   * Required when:
   * - Generating LavaMoat policies (static analysis needs full module graph)
   * - Using --reactCompilerVerbose (stats collection requires _module.buildMeta
   *   which is null in thread-loader workers)
   */
  disableThreadLoader: boolean;
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
  const { target, verbose, debug, disableThreadLoader } = config;

  const reactCompilerOptions = {
    target,
    panicThreshold: debug === 'none' ? undefined : `${debug}_errors`,
  } as const satisfies ReactCompilerLoaderOption;

  const loaders: RuleSetUseItem[] = [];

  // Add thread-loader for parallelization when enabled
  if (!disableThreadLoader) {
    loaders.push({
      loader: 'thread-loader',
      options: {
        // Leave one core for system processes; availableParallelism respects cgroups/container limits
        workers: availableParallelism() - 1 || 1,
        workerParallelJobs: 50,
      },
    });
  }

  // Use wrapper for buildMeta tracking when thread-loader is active
  // Skip wrapper when thread-loader is disabled (wrapper not needed, also not resolvable under LavaMoat)
  if (!disableThreadLoader) {
    loaders.push({
      loader: getWrapperPath(),
      options: {
        ...defineReactCompilerLoaderOption(reactCompilerOptions),
        // eslint-disable-next-line @typescript-eslint/naming-convention
        __verbose: verbose,
      },
    });
  } else {
    // Direct loader without wrapper (for policy generation or verbose mode)
    loaders.push({
      loader: reactCompilerLoader,
      options: defineReactCompilerLoaderOption(reactCompilerOptions),
    });
  }

  return loaders;
};
