/**
 * Jest → Vitest global compatibility shim.
 *
 * Loaded as the very first setupFile so that every subsequent setup file and
 * every test file can call `jest.*` APIs without any per-file changes.
 *
 * `jest.requireMock` is synchronous in Jest; we resolve it from all Vitest mocker
 * registries (including `"global"`) with path heuristics.
 *
 * `jest.requireActual('react')`-style bare specifiers use `createRequire` so they
 * can be spread inside sync mock factories. Relative specifiers load app ESM via
 * `import(fileURL)` and return a Promise — the `async-relative-require-actual`
 * plugin in vitest.config.ts inserts `await` and `async` mock factories.
 */

import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename, dirname, resolve as pathResolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
// eslint-disable-next-line import-x/no-extraneous-dependencies
import { parseSingleStack } from '@vitest/utils/source-map';
import { vi, afterEach } from 'vitest';

type VitestMockInstance = typeof vi;

type ManualMockEntry = {
  type: 'manual';
  raw: string;
  id: string;
  resolve: () => unknown;
};

type CjsMockEntry = {
  caller: string;
  raw: string;
  factory: () => unknown;
  value?: unknown;
  resolved?: string | null;
};

type NodeModuleWithLoad = typeof import('node:module') & {
  _load?: (
    request: string,
    parent?: { filename?: string },
    isMain?: boolean,
  ) => unknown;
};

function slash(p: string): string {
  return p.replace(/\\/gu, '/');
}

function toFsPath(file: string): string {
  const [withoutQuery] = file.split('?');
  if (withoutQuery.startsWith('file:')) {
    try {
      return fileURLToPath(withoutQuery);
    } catch {
      return withoutQuery;
    }
  }
  return withoutQuery;
}

function stripKnownExtension(p: string): string {
  return p.replace(/\.(mjs|cjs|ts|tsx|js|jsx)$/u, '');
}

function getVitestMocker():
  | {
      getMockerRegistry: () => {
        registryById: Map<string, ManualMockEntry | { type: string }>;
      };
      /** Hoisted mocks can be registered under `"global"` before Vitest sets the current filepath. */
      registries?: Map<string, { registryById: Map<string, unknown> }>;
    }
  | undefined {
  return (
    globalThis as {
      ['__vitest_mocker__']?: {
        getMockerRegistry: () => {
          registryById: Map<string, ManualMockEntry | { type: string }>;
        };
        registries?: Map<string, { registryById: Map<string, unknown> }>;
      };
    }
  ).__vitest_mocker__;
}

function lookupManualMock<TModule>(
  moduleName: string,
  caller?: string,
): { found: true; value: TModule } | { found: false } {
  const mocker = getVitestMocker();
  if (!mocker?.getMockerRegistry) {
    return { found: false };
  }

  const resolvedRelative =
    moduleName.startsWith('.') && caller
      ? slash(pathResolve(dirname(caller), moduleName))
      : null;

  let resolvedByNode: string | null = null;
  if (moduleName.startsWith('.') && caller) {
    try {
      resolvedByNode = slash(createRequire(caller).resolve(moduleName));
    } catch {
      resolvedByNode = null;
    }
  }

  const registryList = mocker.registries?.size
    ? [...mocker.registries.values()]
    : [mocker.getMockerRegistry()];

  for (const registry of registryList) {
    for (const mock of registry.registryById.values()) {
      if (
        !mock ||
        typeof mock !== 'object' ||
        (mock as { type?: string }).type !== 'manual'
      ) {
        continue;
      }
      const manual = mock as ManualMockEntry;
      if (manual.raw === moduleName) {
        return { found: true, value: manual.resolve() as TModule };
      }
      if (caller && moduleName.startsWith('.')) {
        const idFs = slash(toFsPath(manual.id));
        const candidates = [resolvedRelative, resolvedByNode].filter(Boolean);
        for (const cand of candidates) {
          if (
            cand &&
            (idFs === cand ||
              stripKnownExtension(idFs) === stripKnownExtension(cand))
          ) {
            return { found: true, value: manual.resolve() as TModule };
          }
        }
        // createRequire often cannot resolve extensionless TS specifiers; match
        // by parent folder + basename (Vitest stores resolved absolute ids).
        if (resolvedRelative) {
          const wantBase = stripKnownExtension(basename(resolvedRelative));
          const wantDir = slash(dirname(resolvedRelative));
          const idBase = stripKnownExtension(basename(idFs));
          const idDir = slash(dirname(idFs));
          if (wantBase === idBase && wantDir === idDir) {
            return { found: true, value: manual.resolve() as TModule };
          }
        }
      }
    }
  }

  return { found: false };
}

const cjsMockRegistry: CjsMockEntry[] = [];
const cjsMockPendingKey = '__vitest_cjs_mock_pending__';
const cjsMockRegisterKey = '__vitest_cjs_mock_register__';
const cjsMockGlobal = globalThis as typeof globalThis & {
  [cjsMockPendingKey]?: [string, string, () => unknown][];
  [cjsMockRegisterKey]?: (
    caller: string,
    raw: string,
    factory: () => unknown,
  ) => void;
};
const nodeModule = createRequire(import.meta.url)(
  'node:module',
) as NodeModuleWithLoad;
const originalCjsLoad = nodeModule._load?.bind(nodeModule);

function resolveFromFile(caller: string, specifier: string): string | null {
  try {
    return slash(createRequire(caller).resolve(specifier));
  } catch {
    return null;
  }
}

function getCjsMockValue(entry: CjsMockEntry): unknown {
  const manualMock = lookupManualMock(entry.raw, entry.caller);
  if (manualMock.found) {
    return manualMock.value;
  }

  if (!Object.prototype.hasOwnProperty.call(entry, 'value')) {
    const value = entry.factory();
    if (value && typeof (value as Promise<unknown>).then === 'function') {
      throw new Error(
        `[vitest-compat] jest.mock('${entry.raw}') uses an async factory, which cannot be returned from CommonJS require()`,
      );
    }
    entry.value = value;
  }
  return entry.value;
}

function registerCjsMock(
  caller: string,
  raw: string,
  factory: () => unknown,
): void {
  cjsMockRegistry.push({
    caller: toFsPath(caller),
    raw,
    factory,
    resolved: resolveFromFile(toFsPath(caller), raw),
  });
}

cjsMockGlobal[cjsMockRegisterKey] = registerCjsMock;
for (const [caller, raw, factory] of cjsMockGlobal[cjsMockPendingKey] ??
  []) {
  registerCjsMock(caller, raw, factory);
}
cjsMockGlobal[cjsMockPendingKey] = [];

if (originalCjsLoad) {
  nodeModule._load = function (
    request: string,
    parent?: { filename?: string },
    isMain?: boolean,
  ) {
    const parentFile = parent?.filename;
    const resolvedFromParent = parentFile
      ? resolveFromFile(parentFile, request)
      : null;

    for (const entry of [...cjsMockRegistry].reverse()) {
      if (
        entry.raw === request ||
        (entry.resolved &&
          resolvedFromParent &&
          entry.resolved === resolvedFromParent)
      ) {
        return getCjsMockValue(entry);
      }
    }

    return originalCjsLoad(request, parent, isMain);
  };
}

/** First stack frame after any `vitest-compat` frame (the real caller). */
function getCallerFileAboveCompat(): string | undefined {
  const lines = new Error().stack?.split('\n') ?? [];
  let passedCompat = false;
  for (const line of lines) {
    if (line.includes('vitest-compat')) {
      passedCompat = true;
      continue;
    }
    if (!passedCompat) {
      continue;
    }
    const parsed = parseSingleStack(line);
    const file = parsed?.file;
    if (!file || file.includes('node_modules')) {
      continue;
    }
    return toFsPath(file);
  }
  return undefined;
}

function requireActualBareSpecifierSync<TModule>(moduleName: string): TModule {
  const caller = getCallerFileAboveCompat();
  if (!caller) {
    throw new Error(
      '[vitest-compat] jest.requireActual: could not determine caller file from stack',
    );
  }
  const req = createRequire(caller);
  return req(moduleName) as TModule;
}

function resolveRelativeSpecifierToFile(
  caller: string,
  specifier: string,
): string {
  const base = pathResolve(dirname(caller), specifier);
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    `${base}.jsx`,
    `${base}/index.ts`,
    `${base}/index.tsx`,
    `${base}/index.js`,
    `${base}/index.jsx`,
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  throw new Error(
    `[vitest-compat] jest.requireActual: could not resolve "${specifier}" from ${caller}`,
  );
}

async function importActualRelative<TModule>(
  moduleName: string,
): Promise<TModule> {
  const caller = getCallerFileAboveCompat();
  if (!caller) {
    return vi.importActual<TModule>(moduleName);
  }
  const file = resolveRelativeSpecifierToFile(caller, moduleName);
  const { href } = pathToFileURL(file);
  // eslint-disable-next-line jsdoc/no-bad-blocks
  return import(/* @vite-ignore */ href) as Promise<TModule>;
}

/**
 * Bare imports (e.g. `react`) resolve to CJS builds via Node and can be spread
 * synchronously inside mock factories. Relative specifiers point at app ESM;
 * they are loaded via dynamic `import()` from the caller file (see
 * `async-relative-require-actual` transform in vitest.config.ts).
 */
/**
 * Compatibility layer for Jest's `requireActual`.
 *
 * @param moduleName - Module specifier passed by tests.
 */
function requireActualJestCompat<TModule>(
  moduleName: string,
): TModule | Promise<TModule> {
  if (moduleName.startsWith('.') || moduleName.startsWith('/')) {
    return importActualRelative<TModule>(moduleName);
  }
  try {
    return requireActualBareSpecifierSync<TModule>(moduleName);
  } catch {
    return vi.importActual<TModule>(moduleName);
  }
}

function requireMockSync<TModule>(moduleName: string): TModule {
  const mocker = getVitestMocker();

  if (!mocker?.getMockerRegistry) {
    throw new Error(
      '[vitest-compat] jest.requireMock: __vitest_mocker__ is not available',
    );
  }

  const caller = getCallerFileAboveCompat();
  const manualMock = lookupManualMock<TModule>(moduleName, caller);
  if (manualMock.found) {
    return manualMock.value;
  }

  throw new Error(
    `[vitest-compat] jest.requireMock('${moduleName}'): no matching manual mock (caller: ${caller ?? 'unknown'})`,
  );
}

// ---------------------------------------------------------------------------
// jest.replaceProperty – replaces any property on any object and restores it
// after each test (mirrors Jest 29's jest.replaceProperty behaviour).
// ---------------------------------------------------------------------------

type Replaced<TValue> = { restore: () => void; value: TValue };

const _replacements: (() => void)[] = [];

function replaceProperty<TObject extends object, TKey extends keyof TObject>(
  obj: TObject,
  key: TKey,
  value: TObject[TKey],
): Replaced<TObject[TKey]> {
  const descriptor = Object.getOwnPropertyDescriptor(obj, key);
  const originalValue = obj[key];

  Object.defineProperty(obj, key, {
    value,
    writable: true,
    configurable: true,
    enumerable: descriptor?.enumerable ?? true,
  });

  const restore = () => {
    if (descriptor) {
      Object.defineProperty(obj, key, descriptor);
    } else {
      // Property didn't exist originally – delete it
      delete obj[key];
    }
  };

  _replacements.push(restore);
  return { restore, value: originalValue };
}

// Auto-restore after every test, matching Jest's behaviour with restoreMocks
afterEach(() => {
  while (_replacements.length) {
    _replacements.pop()?.();
  }
});

// ---------------------------------------------------------------------------
// vi.fn – Vitest rejects `new` on mocks whose implementation is an arrow
// function. Jest allows `jest.fn().mockImplementation(() => ({ ... }))` with
// `new`.  Wrap arrow implementations in a traditional function (same as Jest).
// ---------------------------------------------------------------------------

function wrapArrowImplementation(impl: unknown): unknown {
  if (
    typeof impl === 'function' &&
    !Object.prototype.hasOwnProperty.call(impl, 'prototype')
  ) {
    const fn = impl as (...args: unknown[]) => unknown;
    return function compatConstructorWrapper(
      this: unknown,
      ...args: unknown[]
    ) {
      return fn.apply(this, args);
    };
  }
  return impl;
}

const _baseViFn = vi.fn.bind(vi);
vi.fn = function jestCompatibleViFn(
  ...args: unknown[]
): ReturnType<typeof vi.fn> {
  const wrappedArgs = args.map((a) => wrapArrowImplementation(a));
  const mock = _baseViFn(...(wrappedArgs as Parameters<typeof vi.fn>)) as {
    mockImplementation: (impl: unknown) => unknown;
    mockImplementationOnce: (impl: unknown) => unknown;
    mockReturnValue: (value: unknown) => unknown;
    mockReturnValueOnce: (value: unknown) => unknown;
  };
  const origImpl = mock.mockImplementation.bind(mock);
  const origOnce = mock.mockImplementationOnce.bind(mock);
  mock.mockImplementation = (impl: unknown) =>
    origImpl(wrapArrowImplementation(impl));
  mock.mockImplementationOnce = (impl: unknown) =>
    origOnce(wrapArrowImplementation(impl));
  mock.mockReturnValue = (value: unknown) =>
    origImpl(function mockReturnValueCompat() {
      return value;
    });
  mock.mockReturnValueOnce = (value: unknown) =>
    origOnce(function mockReturnValueOnceCompat() {
      return value;
    });
  return mock as ReturnType<typeof vi.fn>;
} as typeof vi.fn;

// ---------------------------------------------------------------------------
// Assemble the shim
// ---------------------------------------------------------------------------

const jestCompat = Object.assign(vi, {
  dontMock: vi.doUnmock.bind(vi),
  requireActual: requireActualJestCompat,
  requireMock: requireMockSync,
  replaceProperty,
  setTimeout: (timeout: number) => {
    vi.setConfig({ testTimeout: timeout });
  },
} as unknown as VitestMockInstance);

// @ts-expect-error – deliberately writing to globalThis for broad compat
globalThis.jest = jestCompat;
