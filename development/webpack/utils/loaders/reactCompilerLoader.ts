import type { RuleSetUseItem } from 'webpack';
import {
  type ReactCompilerLoaderOption,
  defineReactCompilerLoaderOption,
} from 'react-compiler-webpack';

const getWrapperPath = () => require.resolve('./reactCompilerLoaderWrapper');

/**
 * React Compiler result status stored in module.buildInfo (not buildMeta,
 * which webpack hashes into the module hash).
 * This allows statistics to be collected from all modules after compilation.
 * NOTE: buildInfo tracking only works without thread-loader (this._module is
 * null in worker contexts), so it is only active in verbose mode.
 */
export type ReactCompilerStatus =
  | 'compiled'
  | 'skipped'
  | 'error'
  | 'unsupported';

export const REACT_COMPILER_STATUS_KEY = '__reactCompilerStatus__';

/**
 * Per-file or per-compilation component counts. Stored in buildInfo when
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
 * Statistics collected from module buildInfo after compilation.
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
};

/**
 * Get the React Compiler loader configuration.
 *
 * Always uses the wrapper loader. Besides stats collection (only possible when
 * thread-loader is off) and verbose logging, the wrapper names the input file
 * relative to the build context inside Babel's source map, which every build
 * needs for reproducible module hashes. See `toWebpackSourceName`.
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
  const { target, verbose, debug } = config;

  const reactCompilerOptions = {
    target,
    panicThreshold: debug === 'none' ? undefined : `${debug}_errors`,
  } as const satisfies ReactCompilerLoaderOption;

  return {
    loader: getWrapperPath(),
    options: {
      ...defineReactCompilerLoaderOption(reactCompilerOptions),
      __verbose: verbose,
    },
  };
}
