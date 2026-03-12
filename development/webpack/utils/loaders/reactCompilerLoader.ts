import type { RuleSetUseItem } from 'webpack';
import {
  reactCompilerLoader,
  type ReactCompilerLoaderOption,
  defineReactCompilerLoaderOption,
} from 'react-compiler-webpack';

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

export const REACT_COMPILER_STATUS_KEY = '__reactCompilerStatus__';

/**
 * Per-file or per-compilation component counts. Stored in buildMeta when
 * using the wrapper loader; aggregated by ReactCompilerPlugin.
 */
export type ReactCompilerStatusCounts = Record<ReactCompilerStatus, number>;

/**
 * Single log entry for a compilation event (one component/function).
 */
export type ReactCompilerLogEntry = {
  filename: string;
  status: ReactCompilerStatus;
  kind: 'CompileSuccess' | 'CompileSkip' | 'CompileError';
  message?: string;
  loc?: { line: number; column: number };
};

/**
 * Per-file breakdown for verbose reporting (files with multiple statuses).
 */
export type ReactCompilerFileDetail = {
  filename: string;
  counts: ReactCompilerStatusCounts;
};

/**
 * Statistics collected from module buildMeta after compilation.
 * File-level counts use worst-status-wins; component-level counts are raw.
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
  /** Component-level totals across all files. */
  componentCounts: ReactCompilerStatusCounts;
  /** Per-file breakdown for files with multiple statuses (verbose). */
  fileDetails: ReactCompilerFileDetail[];
  /** Full event log for verbose reporting. */
  events: ReactCompilerLogEntry[];
};

export type ReactCompilerLoaderConfig = {
  target: ReactCompilerLoaderOption['target'];
  verbose: boolean;
  debug: 'all' | 'critical' | 'none';
  /**
   * When true, uses the wrapper loader for buildMeta tracking in worker
   * threads and verbose logging. When false, only uses the wrapper if
   * `verbose` is true (for logging); otherwise uses the direct loader.
   */
  threadLoaderEnabled: boolean;
};

/**
 * Get the React Compiler loader configuration.
 *
 * Uses the wrapper loader when thread-loader is active (for buildMeta
 * tracking across worker threads) or when verbose logging is requested.
 * Falls back to the direct `react-compiler-webpack` loader otherwise
 * (e.g. LavaMoat policy generation where the wrapper isn't resolvable).
 *
 * @param config - Configuration options for the React Compiler loader.
 * @param config.target - The target version of the React Compiler.
 * @param config.verbose - Whether to enable verbose mode.
 * @param config.debug - The debug level to use.
 * - 'all': Fail build on and display debug information for all compilation errors.
 * - 'critical': Fail build on and display debug information only for critical compilation errors.
 * - 'none': Prevent build from failing.
 * @returns A single `RuleSetUseItem` for the compiler loader.
 */
export function getReactCompilerLoader(
  config: ReactCompilerLoaderConfig,
): RuleSetUseItem {
  const { target, verbose, debug, threadLoaderEnabled } = config;

  const reactCompilerOptions = {
    target,
    panicThreshold: debug === 'none' ? undefined : `${debug}_errors`,
  } as const satisfies ReactCompilerLoaderOption;

  const useWrapper = threadLoaderEnabled || verbose;

  return useWrapper
    ? {
        loader: getWrapperPath(),
        options: {
          ...defineReactCompilerLoaderOption(reactCompilerOptions),
          // eslint-disable-next-line @typescript-eslint/naming-convention
          __verbose: verbose,
        },
      }
    : {
        loader: reactCompilerLoader,
        options: defineReactCompilerLoaderOption(reactCompilerOptions),
      };
}
