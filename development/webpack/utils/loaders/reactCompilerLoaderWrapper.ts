/**
 * Wrapper loader for react-compiler-webpack that stores compilation status
 * in module.buildMeta for collection by ReactCompilerPlugin.
 *
 * LIMITATION: Stats collection via buildMeta does NOT work with thread-loader
 * because `this._module` is null in worker contexts. The webpack config
 * automatically disables thread-loader when --reactCompilerVerbose is used.
 *
 * @type {import('webpack').LoaderDefinitionFunction<LoaderOptions>}
 */
'use strict';

let actualLoader;
import(
  'react-compiler-webpack/dist/react-compiler-loader.js'
).then((module) => {
  actualLoader = module.default;
});

const REACT_COMPILER_STATUS_KEY = '__reactCompilerStatus__';

/**
 * @this {import('webpack').LoaderContext<LoaderOptions>}
 * @param {string} source
 * @param {string} [sourceMap]
 */
export default function reactCompilerLoaderWrapper(source, sourceMap) {
  const options = this.getOptions();
  const { __verbose: verbose, ...loaderOptions } = options;
  const buildMeta =
    /** @type {Record<string, unknown> | undefined} */ this._module?.buildMeta;

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

  const originalGetOptions = this.getOptions.bind(this);
  this.getOptions = () =>
    logger ? { ...loaderOptions, logger } : loaderOptions;

  try {
    return actualLoader.call(this, source, sourceMap);
  } finally {
    this.getOptions = originalGetOptions;
  }
}
