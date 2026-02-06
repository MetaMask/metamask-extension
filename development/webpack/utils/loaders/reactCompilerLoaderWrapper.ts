/**
 * Wrapper loader for react-compiler-webpack that stores compilation status
 * in module.buildMeta for collection by ReactCompilerPlugin.
 *
 * LIMITATION: Stats collection via buildMeta does NOT work with thread-loader
 * because `this._module` is null in worker contexts. The webpack config
 * automatically disables thread-loader when --reactCompilerVerbose is used.
 *
 * NOTE: This loader is synchronous because react-compiler-loader internally
 * uses this.async() for its async operations. Making this wrapper async would
 * cause "callback already called" errors due to double completion signaling.
 */
import { createRequire } from 'node:module';
import type { LoaderContext, LoaderDefinitionFunction } from 'webpack';

const require = createRequire(import.meta.url);

const reactCompilerModule =
  require('react-compiler-webpack/dist/react-compiler-loader.js') as
    | { default: LoaderDefinitionFunction }
    | LoaderDefinitionFunction;

const actualLoader: LoaderDefinitionFunction =
  typeof reactCompilerModule === 'function'
    ? reactCompilerModule
    : reactCompilerModule.default;

const REACT_COMPILER_STATUS_KEY = '__reactCompilerStatus__';

type ReactCompilerStatus = 'compiled' | 'skipped' | 'error' | 'unsupported';

type LoaderOptions = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __verbose?: boolean;
  logger?: unknown;
  [key: string]: unknown;
};

type CompilerEvent = {
  kind: 'CompileSuccess' | 'CompileSkip' | 'CompileError';
  detail?: { options?: { category?: string }; category?: string };
};

/**
 * Wrapper loader that intercepts getOptions to inject a logger for stats collection.
 *
 * @param source - The source code to transform.
 * @param sourceMap - Optional source map.
 * @returns The transformed source code (or undefined if async).
 */
const loader: LoaderDefinitionFunction<LoaderOptions> = function loader(
  source,
  sourceMap,
) {
  const options = this.getOptions();
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const { __verbose: verbose, ...loaderOptions } = options;
  const buildMeta = this._module?.buildMeta as
    | Record<string, unknown>
    | undefined;

  const logger = buildMeta && {
    logEvent: (filename: string | null, event: CompilerEvent) => {
      if (!filename) return;

      const detail = event.detail?.options ?? event.detail;
      let status: ReactCompilerStatus | undefined;

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
        default:
          break;
      }

      if (status) buildMeta[REACT_COMPILER_STATUS_KEY] = status;
    },
  };

  const originalGetOptions = this.getOptions.bind(this);
  this.getOptions = () =>
    (logger ? { ...loaderOptions, logger } : loaderOptions) as LoaderOptions;

  try {
    // Let react-compiler-loader handle async via this.async() internally
    return actualLoader.call(this as LoaderContext<unknown>, source, sourceMap);
  } finally {
    this.getOptions = originalGetOptions;
  }
};

export default loader;
