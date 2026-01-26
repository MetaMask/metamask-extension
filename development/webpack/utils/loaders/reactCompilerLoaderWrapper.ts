/**
 * Wrapper loader for react-compiler-webpack that enables buildMeta tracking.
 *
 * This wrapper sets the current module on our logger before invoking the
 * actual react-compiler-webpack loader, allowing compilation status to be
 * stored in module.buildMeta for later collection by the plugin.
 *
 * This approach works with thread-loader because each worker thread:
 * 1. Has its own logger instance
 * 2. Sets the current module before processing
 * 3. Stores status in module.buildMeta (which webpack collects in main process)
 *
 * NOTE: This file must be self-contained (no imports from other local TS files)
 * because thread-loader workers can't resolve TypeScript imports.
 */
import type { LoaderContext } from 'webpack';

// Keys for storing react compiler status in buildMeta
// Must match the keys in reactCompilerLoader.ts
const REACT_COMPILER_STATUS_KEY = '__reactCompilerStatus__';
const REACT_COMPILER_ERROR_KEY = '__reactCompilerError__';

type ReactCompilerStatus = 'compiled' | 'skipped' | 'error' | 'unsupported';

type WrapperOptions = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __verbose?: boolean;
  [key: string]: unknown;
};

/**
 * Logger that attaches compilation status to webpack module metadata.
 * Each thread-loader worker has its own instance.
 */
class ReactCompilerMetadataLogger {
  private verbose: boolean;

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

// Singleton logger instance for this worker thread
let loggerInstance: ReactCompilerMetadataLogger | null = null;

function getOrCreateLogger(verbose: boolean): ReactCompilerMetadataLogger {
  if (!loggerInstance) {
    loggerInstance = new ReactCompilerMetadataLogger(verbose);
  }
  return loggerInstance;
}

const reactCompilerLoaderWrapper = function (
  this: LoaderContext<WrapperOptions>,
  source: string,
  sourceMap?: string,
) {
  const options = this.getOptions();
  const verbose = options.__verbose ?? false;

  // Initialize/get logger for this worker thread
  const logger = getOrCreateLogger(verbose);

  // Set the current module so the logger can attach status to buildMeta
  if (this._module) {
    // Ensure buildMeta exists
    this._module.buildMeta = this._module.buildMeta || {};
    logger.setCurrentModule(this._module);
  }

  // Load and call the actual react-compiler-webpack loader
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const actualLoader = require('react-compiler-webpack/dist/react-compiler-loader');

  // Remove our custom option before passing to the real loader
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const { __verbose, ...loaderOptions } = options;

  // Inject our logger into the options if verbose mode is enabled
  const optionsWithLogger = verbose
    ? { ...loaderOptions, logger }
    : loaderOptions;

  // Temporarily override getOptions to return cleaned options with our logger
  const originalGetOptions = this.getOptions.bind(this);
  this.getOptions = () =>
    optionsWithLogger as ReturnType<typeof originalGetOptions>;

  try {
    return actualLoader.call(this, source, sourceMap);
  } finally {
    this.getOptions = originalGetOptions;
  }
};

export default reactCompilerLoaderWrapper;
