import path from 'path';
import {
  reactCompilerLoader,
  type ReactCompilerLoaderOption,
  defineReactCompilerLoaderOption,
} from 'react-compiler-webpack';

/**
 * Lazily resolve the wrapper path to avoid resolution errors during LavaMoat policy generation.
 * The wrapper is only needed when thread-loader is active (i.e., NOT during policy generation).
 */
const getWrapperPath = (() => {
  let cachedPath: string | null = null;
  return () => {
    if (cachedPath === null) {
      // Resolve to source location regardless of whether running from source or compiled (.webpack) code
      cachedPath = path.join(
        __dirname.replace('.webpack', 'webpack'),
        'reactCompilerLoaderWrapper.cjs',
      );
    }
    return cachedPath;
  };
})();

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

// Keys for storing react compiler status in buildMeta
// Must match the keys in reactCompilerLoaderWrapper.cjs
export const REACT_COMPILER_STATUS_KEY = '__reactCompilerStatus__';
export const REACT_COMPILER_ERROR_KEY = '__reactCompilerError__';

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

/**
 * Get the React Compiler loader configuration.
 *
 * @param target - The target version of the React Compiler.
 * @param verbose - Whether to enable verbose mode (per-file logging).
 * @param debug - The debug level to use.
 * - 'all': Fail build on all compilation errors.
 * - 'critical': Fail build on critical compilation errors only.
 * - 'none': Don't fail the build on errors.
 * @param useWrapper - Whether to use the wrapper loader for buildMeta tracking.
 * Set to false when generating LavaMoat policies (thread-loader is disabled anyway).
 * @returns The React Compiler loader object with the loader and configured options.
 */
export const getReactCompilerLoader = (
  target: ReactCompilerLoaderOption['target'],
  verbose: boolean,
  debug: 'all' | 'critical' | 'none',
  useWrapper = true,
) => {
  const reactCompilerOptions = {
    target,
    panicThreshold: debug === 'none' ? undefined : `${debug}_errors`,
  } as const satisfies ReactCompilerLoaderOption;

  // Use wrapper for buildMeta tracking (needed for thread-loader stats collection)
  // Skip wrapper during policy generation (thread-loader disabled, wrapper not resolvable under LavaMoat)
  if (useWrapper) {
    return {
      loader: getWrapperPath(),
      options: {
        ...defineReactCompilerLoaderOption(reactCompilerOptions),
        // eslint-disable-next-line @typescript-eslint/naming-convention
        __verbose: verbose,
      },
    };
  }

  // Direct loader without wrapper (for policy generation)
  return {
    loader: reactCompilerLoader,
    options: defineReactCompilerLoaderOption(reactCompilerOptions),
  };
};
