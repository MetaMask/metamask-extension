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
 */
import type { LoaderContext } from 'webpack';
import { setCurrentModule, getOrCreateLogger } from './reactCompilerLoader';

type WrapperOptions = {
  __verbose?: boolean;
  [key: string]: unknown;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const reactCompilerLoaderWrapper = function (
  this: LoaderContext<WrapperOptions>,
  source: string,
  sourceMap?: string,
) {
  const options = this.getOptions();
  const verbose = options.__verbose ?? false;

  // Initialize logger if needed (for this worker thread)
  getOrCreateLogger(verbose);

  // Set the current module so the logger can attach status to buildMeta
  if (this._module) {
    // Ensure buildMeta exists
    this._module.buildMeta = this._module.buildMeta || {};
    setCurrentModule(this._module);
  }

  // Load and call the actual react-compiler-webpack loader
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const actualLoader = require('react-compiler-webpack/dist/react-compiler-loader');

  // Remove our custom option before passing to the real loader
  const { __verbose, ...loaderOptions } = options;

  // Temporarily override getOptions to return cleaned options
  const originalGetOptions = this.getOptions.bind(this);
  this.getOptions = () => loaderOptions as ReturnType<typeof originalGetOptions>;

  try {
    return actualLoader.call(this, source, sourceMap);
  } finally {
    this.getOptions = originalGetOptions;
  }
};

export default reactCompilerLoaderWrapper;
