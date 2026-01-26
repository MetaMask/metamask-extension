import {
  type ReactCompilerLoaderOption,
  defineReactCompilerLoaderOption,
} from 'react-compiler-webpack';

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
// Must match the keys in reactCompilerLoaderWrapper.ts
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
 * @returns The React Compiler loader object with the loader and configured options.
 */
export const getReactCompilerLoader = (
  target: ReactCompilerLoaderOption['target'],
  verbose: boolean,
  debug: 'all' | 'critical' | 'none',
) => {
  const reactCompilerOptions = {
    target,
    // Don't pass logger here - the wrapper will inject it
    // This prevents serialization issues with thread-loader
    panicThreshold: debug === 'none' ? undefined : `${debug}_errors`,
  } as const satisfies ReactCompilerLoaderOption;

  return {
    // Use our wrapper loader that handles buildMeta tracking
    loader: require.resolve('./reactCompilerLoaderWrapper'),
    options: {
      ...defineReactCompilerLoaderOption(reactCompilerOptions),
      // Pass verbose flag so wrapper knows to enable logging
      // eslint-disable-next-line @typescript-eslint/naming-convention
      __verbose: verbose,
    },
  };
};
