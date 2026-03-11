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
 *
 * NOTE: REACT_COMPILER_STATUS_KEY is duplicated here (also in reactCompilerLoader.ts)
 * because cross-file imports fail in thread-loader worker context due to ESM
 * resolution issues. Both values MUST stay in sync.
 */
import { createRequire } from 'node:module';
import type { Schema } from 'schema-utils';
import type { LoaderDefinitionFunction } from 'webpack';

// Thread-loader workers may load this file as either CJS or ESM depending on
// Node.js version and registered loaders. createRequire(import.meta.url) works
// in both: tsx shims import.meta.url in CJS, and it's native in ESM.
// @ts-expect-error import.meta.url is valid at runtime in both CJS (tsx shim) and ESM contexts
const esmRequire = createRequire(import.meta.url);
const reactCompilerModule = esmRequire(
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
  // eslint-disable-next-line @typescript-eslint/naming-convention
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
  const buildMeta = this._module?.buildMeta as
    | Record<string, unknown>
    | undefined;

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
    if (
      typeof (detail as { toString?: () => string }).toString === 'function'
    ) {
      try {
        return (detail as { toString: () => string }).toString();
      } catch {
        return undefined;
      }
    }
    try {
      return JSON.stringify(detail);
    } catch {
      return undefined;
    }
  }

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
          // This error is thrown for syntax that is not yet supported by the React Compiler.
          // We count these separately as "unsupported" errors, since there's no actionable fix we can apply.
          status = detail?.category === 'Todo' ? 'unsupported' : 'error';
          if (verbose) {
            if (status === 'unsupported') {
              console.warn(`🔍 Unsupported: ${filename}`);
            }
            if (status === 'error') {
              const errMsg = detail ? JSON.stringify(detail) : 'Unknown error';
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
        const stored = buildMeta[REACT_COMPILER_STATUS_KEY] as
          | { events: Record<string, unknown>[] }
          | undefined;
        const events = stored?.events ?? [];
        const loc = event.fnLoc?.start;
        const message = extractMessage(detail);
        const entry: Record<string, unknown> = {
          filename,
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
        buildMeta[REACT_COMPILER_STATUS_KEY] = { events };
      }
    },
  };

  const originalGetOptions = this.getOptions.bind(this);
  this.getOptions = (schema?: Schema) => {
    const opts = (
      schema === undefined ? originalGetOptions() : originalGetOptions(schema)
    ) as LoaderOptions;
    return (logger ? { ...opts, logger } : opts) as LoaderOptions;
  };

  const result = actualLoader.call(this, source, sourceMap);

  // react-compiler-loader uses this.async() and returns undefined (not a
  // callback). It reads options synchronously before returning, so restoring
  // getOptions immediately is correct.
  this.getOptions = originalGetOptions;
  return result;
};

export default loader;
