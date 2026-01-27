/**
 * Wrapper loader for react-compiler-webpack that stores compilation status
 * in module.buildMeta for collection by ReactCompilerPlugin.
 *
 * NOTE: Must be CommonJS (.cjs) - thread-loader workers need native require().
 *
 * @type {import('webpack').LoaderDefinitionFunction<LoaderOptions>}
 */
'use strict';

/**
 * @typedef {'compiled' | 'skipped' | 'error' | 'unsupported'} ReactCompilerStatus
 *
 * @typedef {object} LoaderOptions
 * @property {boolean} [__verbose] - Enable verbose logging
 * @property {string} [target] - React compiler target
 * @property {string} [panicThreshold] - Error threshold
 *
 * @typedef {object} CompilerEvent
 * @property {'CompileSuccess' | 'CompileSkip' | 'CompileError'} kind
 * @property {{ options?: { category?: string }, category?: string }} [detail]
 *
 * @typedef {object} CompilerLogger
 * @property {(filename: string | null, event: CompilerEvent) => void} logEvent
 */

const REACT_COMPILER_STATUS_KEY = '__reactCompilerStatus__';

/**
 * @this {import('webpack').LoaderContext<LoaderOptions>}
 * @param {string} source
 * @param {string} [sourceMap]
 */
module.exports = function reactCompilerLoaderWrapper(source, sourceMap) {
  const options = this.getOptions();
  const { __verbose: verbose, ...loaderOptions } = options;
  const buildMeta = /** @type {Record<string, unknown> | undefined} */ (
    this._module?.buildMeta
  );

  /** @type {CompilerLogger | undefined} */
  const logger = buildMeta && {
    logEvent: (filename, event) => {
      if (!filename) return;

      const detail = event.detail?.options ?? event.detail;
      /** @type {ReactCompilerStatus | undefined} */
      let status;

      switch (event.kind) {
        case 'CompileSuccess':
          status = 'compiled';
          if (verbose) console.log(`✅ Compiled: ${filename}`);
          break;
        case 'CompileSkip':
          status = 'skipped';
          break;
        case 'CompileError':
          status = detail?.category === 'Todo' ? 'unsupported' : 'error';
          if (verbose && status === 'error') {
            console.error(`❌ Error: ${filename}`);
          }
          break;
      }

      if (status) buildMeta[REACT_COMPILER_STATUS_KEY] = status;
    },
  };

  const actualLoader = require('react-compiler-webpack/dist/react-compiler-loader');
  const originalGetOptions = this.getOptions.bind(this);
  this.getOptions = () => (logger ? { ...loaderOptions, logger } : loaderOptions);

  try {
    return actualLoader.call(this, source, sourceMap);
  } finally {
    this.getOptions = originalGetOptions;
  }
};
