/**
 * Wrapper loader for react-compiler-webpack that stores compilation status
 * in module.buildInfo for collection by ReactCompilerPlugin.
 *
 * LIMITATION: Stats collection via buildInfo does NOT work with thread-loader
 * because `this._module` is null in worker contexts. The webpack config
 * automatically disables thread-loader when --reactCompilerVerbose is used.
 *
 * NOTE: This loader is synchronous because react-compiler-loader internally
 * uses this.async() for its async operations. Making this wrapper async would
 * cause "callback already called" errors due to double completion signaling.
 *
 * NOTE: REACT_COMPILER_STATUS_KEY is duplicated here (also in reactCompilerLoader.ts)
 * because cross-file imports fail in thread-loader worker context due to ESM
 * resolution issues. Both values MUST stay in sync.
 */
import { createRequire } from 'node:module';
import { join, relative } from 'node:path';
import type { Schema } from 'schema-utils';
import type { LoaderDefinitionFunction } from 'webpack';
import { toWebpackSourceName } from '../helpers';

// Resolve from the repo root so this works when tsx loads the source as ESM
// in thread-loader workers and when tsc emits the same file as CJS for
// LavaMoat policy generation.
// TODO: Remove once `@lavamoat/node` supports ESM.
const requireFromRepoRoot = createRequire(join(process.cwd(), 'package.json'));
const reactCompilerModule = requireFromRepoRoot(
  'react-compiler-webpack/dist/react-compiler-loader.js',
) as { default: LoaderDefinitionFunction } | LoaderDefinitionFunction;

const actualLoader: LoaderDefinitionFunction =
  typeof reactCompilerModule === 'function'
    ? reactCompilerModule
    : reactCompilerModule.default;
// IMPORTANT: Must match REACT_COMPILER_STATUS_KEY in reactCompilerLoader.ts
const REACT_COMPILER_STATUS_KEY = '__reactCompilerStatus__';

type ReactCompilerStatus = 'compiled' | 'skipped' | 'error' | 'unsupported';

type LoaderOptions = {
  __verbose?: boolean;
  logger?: unknown;
  [key: string]: unknown;
};

type CompilerEvent = {
  kind: 'CompileSuccess' | 'CompileSkip' | 'CompileError';
  fnLoc?: { start?: { line?: number; column?: number } } | null;
  detail?: {
    options?: { category?: string };
    category?: string;
    message?: string;
    reason?: string;
    toString?: () => string;
  };
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
  const verbose = options.__verbose ?? false;
  // Stats go on `buildInfo`, never `buildMeta`: webpack hashes
  // `JSON.stringify(buildMeta)` into every module's `buildInfo.hash`, so the
  // compiler events (which name the file) would make module hashes depend on
  // the absolute build path and on whether this loader happened to run
  // in-process or in a thread-loader worker. `buildInfo` is not hashed.
  const buildInfo = this._module?.buildInfo as
    | Record<string, unknown>
    | undefined;
  const { rootContext } = this;

  function extractMessage(detail: CompilerEvent['detail']): string | undefined {
    if (!detail) {
      return undefined;
    }
    const d = detail as Record<string, unknown>;
    if (typeof d.message === 'string') {
      return d.message;
    }
    if (typeof d.reason === 'string') {
      return d.reason;
    }
    try {
      return JSON.stringify(detail);
    } catch {
      return undefined;
    }
  }

  const logger = buildInfo && {
    logEvent: (filename: string | null, event: CompilerEvent) => {
      if (!filename) return;

      const category =
        event.detail?.options?.category ?? event.detail?.category;
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
          // This error is thrown for syntax that is not yet supported by the React Compiler.
          // We count these separately as "unsupported" errors, since there's no actionable fix we can apply.
          status = category === 'Todo' ? 'unsupported' : 'error';
          if (verbose) {
            if (status === 'unsupported') {
              console.warn(`🔍 Unsupported: ${filename}`);
            }
            if (status === 'error') {
              const errMsg = event.detail
                ? JSON.stringify(event.detail)
                : 'Unknown error';
              console.error(
                `❌ React Compiler error in ${filename}: ${errMsg}`,
              );
            }
          }
          break;
        default:
          break;
      }

      if (status) {
        const stored = buildInfo[REACT_COMPILER_STATUS_KEY] as
          | { events: Record<string, unknown>[] }
          | undefined;
        const events = stored?.events ?? [];
        const loc = event.fnLoc?.start;
        const message = extractMessage(event.detail);
        const entry: Record<string, unknown> = {
          // relative so the recorded stats are the same from any checkout
          filename: rootContext ? relative(rootContext, filename) : filename,
          status,
          kind: event.kind,
          ...(message && { message }),
          ...(loc &&
            typeof loc.line === 'number' &&
            typeof loc.column === 'number' && {
              loc: { line: loc.line, column: loc.column },
            }),
        };
        events.push(entry);
        buildInfo[REACT_COMPILER_STATUS_KEY] = { events };
      }
    },
  };

  const originalGetOptions = this.getOptions.bind(this);
  this.getOptions = (schema?: Schema) => {
    const opts = (
      schema === undefined ? originalGetOptions() : originalGetOptions(schema)
    ) as LoaderOptions;
    const { __verbose: _verbose, ...rest } = opts;
    const babelTransFormOpt = {
      ...(rest.babelTransFormOpt as Record<string, unknown> | undefined),
      // Babel names the input file by its absolute path inside the source map
      // it generates, and SWC (the next loader) keeps that name when it merges
      // the map. webpack hashes the map into the module hash, so the absolute
      // path would make every module hash depend on where the project lives
      // on disk. Name the file relative to the build context instead, the same
      // way webpack itself does. See `toWebpackSourceName`.
      sourceFileName: toWebpackSourceName(this.rootContext, this.resourcePath),
    };
    const withSourceName = { ...rest, babelTransFormOpt };
    return (
      logger ? { ...withSourceName, logger } : withSourceName
    ) as LoaderOptions;
  };

  try {
    const result = actualLoader.call(this, source, sourceMap);

    // react-compiler-loader uses this.async() and returns undefined (not a
    // callback). It reads options synchronously before returning, so restoring
    // getOptions immediately is correct.
    return result;
  } finally {
    this.getOptions = originalGetOptions;
  }
};

export default loader;
