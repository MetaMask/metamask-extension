import {
  type ReactCompilerLoaderOption,
  defineReactCompilerLoaderOption,
} from 'react-compiler-webpack';
import type { Logger } from 'babel-plugin-react-compiler';

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

// Symbol key for storing react compiler status in buildMeta
// Using a symbol-like string to avoid type conflicts with webpack's BuildMeta
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
 * React Compiler logger that logs to console and tracks statistics.
 *
 * Note: When using thread-loader, each worker has its own logger instance.
 * Per-file console output still works (forwarded from workers), but the
 * summary statistics are collected by the ReactCompilerPlugin by iterating
 * through module buildMeta after compilation.
 */
class ReactCompilerLogger {
  private verbose: boolean;

  // Module reference for storing status in buildMeta (set per-file)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private currentModule: any = null;

  constructor(verbose: boolean) {
    this.verbose = verbose;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setCurrentModule(module: any) {
    this.currentModule = module;
  }

  logEvent(
    filename: string | null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    event: any,
  ) {
    if (filename === null) {
      return;
    }

    const errorDetails = event.detail?.options ?? event.detail;
    let status: ReactCompilerStatus | null = null;

    switch (event.kind) {
      case 'CompileSuccess':
        status = 'compiled';
        if (this.verbose) {
          console.log(`✅ Compiled: ${filename}`);
        }
        break;
      case 'CompileSkip':
        status = 'skipped';
        break;
      case 'CompileError':
        // "Todo" category means unsupported syntax, not an actionable error
        if (errorDetails?.category === 'Todo') {
          status = 'unsupported';
        } else {
          status = 'error';
          if (this.verbose) {
            console.error(
              `❌ React Compiler error in ${filename}: ${
                errorDetails ? JSON.stringify(errorDetails) : 'Unknown error'
              }`,
            );
          }
        }
        break;
      default:
        break;
    }

    // Store status in module buildMeta for the plugin to collect
    if (status && this.currentModule?.buildMeta) {
      this.currentModule.buildMeta[REACT_COMPILER_STATUS_KEY] = status;
      if (status === 'error' && errorDetails) {
        this.currentModule.buildMeta[REACT_COMPILER_ERROR_KEY] =
          JSON.stringify(errorDetails);
      }
    }
  }
}

// Singleton logger instance - note that with thread-loader, each worker
// has its own instance. Per-file logging still works because console
// output is forwarded from workers.
let loggerInstance: ReactCompilerLogger | null = null;

/**
 * Get or create the logger instance.
 *
 * @param verbose - Whether to enable verbose mode (per-file logging).
 */
export function getOrCreateLogger(verbose: boolean): ReactCompilerLogger {
  if (!loggerInstance) {
    loggerInstance = new ReactCompilerLogger(verbose);
  }
  return loggerInstance;
}

/**
 * Set the current module on the logger for buildMeta tracking.
 * Called by our custom loader wrapper.
 *
 * @param module - The current module being processed.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setCurrentModule(module: unknown): void {
  if (loggerInstance) {
    loggerInstance.setCurrentModule(module);
  }
}

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
  // Create/get logger instance
  const logger = getOrCreateLogger(verbose);

  const reactCompilerOptions = {
    target,
    logger: verbose ? (logger as unknown as Logger) : undefined,
    panicThreshold: debug === 'none' ? undefined : `${debug}_errors`,
  } as const satisfies ReactCompilerLoaderOption;

  return {
    // Use our wrapper loader that sets the current module before calling the real loader
    loader: require.resolve('./reactCompilerLoaderWrapper'),
    options: {
      ...defineReactCompilerLoaderOption(reactCompilerOptions),
      // Pass verbose flag so wrapper knows to track modules
      // eslint-disable-next-line @typescript-eslint/naming-convention
      __verbose: verbose,
    },
  };
};
