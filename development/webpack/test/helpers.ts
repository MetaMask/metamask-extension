import { mock } from 'node:test';
import {
  sources,
  type Compiler,
  type Chunk,
  type WebpackOptionsNormalized,
  type Asset,
  type Compilation,
} from 'webpack';

const { SourceMapSource, RawSource } = sources;

type Assets = { [k: string]: unknown };
type ProcessAssetsOptions = { stage?: number };
type ProcessAssetsHandler = {
  stage: number;
  handler: (assets: Assets) => void | Promise<void>;
};

export type Combination<T> = {
  [P in keyof T]: T[P] extends readonly (infer U)[] ? U : never;
};

export function generateCases<T extends object>(obj: T): Combination<T>[] {
  return Object.entries(obj).reduce(
    (acc, [key, value]) => {
      return acc.flatMap((cases) =>
        value.map((cas: unknown) => ({ ...cases, [key]: cas })),
      );
    },
    [{} as Combination<T>],
  );
}

export function mockWebpack(
  files: string[],
  contents: (string | Buffer)[],
  maps: (string | null)[],
  devtool: 'source-map' | 'hidden-source-map' | false = 'source-map',
) {
  const assets = files.reduce(
    (acc, name, i) => {
      const source = contents[i];
      const map = maps?.[i];
      const webpackSource = map
        ? new SourceMapSource(source, name, map)
        : new RawSource(source);
      acc[name] = {
        name,
        info: {
          size: webpackSource.size(),
        },
        source: webpackSource,
      };
      return acc;
    },
    {} as Record<string, Asset>,
  );
  let done: () => void;
  const promise = new Promise<void>((resolve) => {
    done = resolve;
  });
  const processAssetsHandlers: ProcessAssetsHandler[] = [];

  const compilation = {
    get assets() {
      return Object.fromEntries(
        Object.entries(assets).map(([name, asset]) => [name, asset.source]),
      );
    },
    getAssets: mock.fn(() => Object.values(assets)),
    emitAsset: mock.fn((name, source, info) => {
      assets[name] = {
        name,
        info,
        source,
      };
    }),
    options: {
      devtool,
    } as unknown as WebpackOptionsNormalized,
    chunks: new Set([
      {
        files: new Set(Object.keys(assets)),
      } as Chunk,
    ]),
    getAsset: mock.fn((name) => assets[name]),
    updateAsset: mock.fn(
      (name: string, fn: (source: sources.Source) => sources.Source) => {
        return fn(assets[name].source);
      },
    ),
    renameAsset: mock.fn((name: string, newName: string) => {
      const asset = assets[name];
      if (!asset) {
        throw new Error(`Asset not found: ${name}`);
      }
      assets[newName] = {
        ...asset,
        name: newName,
      };
      delete assets[name];

      for (const chunk of compilation.chunks) {
        if (chunk.files.has(name)) {
          chunk.files.delete(name);
          chunk.files.add(newName);
        }
      }
    }),
    deleteAsset: mock.fn((name: string) => {
      delete assets[name];
    }),
    hooks: {
      processAssets: {
        tapPromise(
          options: ProcessAssetsOptions,
          fn: (assets: Assets) => Promise<void>,
        ) {
          processAssetsHandlers.push({
            stage: options.stage ?? 0,
            handler: fn,
          });
        },
        tap(options: ProcessAssetsOptions, fn: (assets: Assets) => void) {
          processAssetsHandlers.push({
            stage: options.stage ?? 0,
            handler: fn,
          });
        },
      },
    },
  };
  const runProcessAssetsHandlers = async () => {
    const handlers = [...processAssetsHandlers].sort(
      (left, right) => left.stage - right.stage,
    );
    for (const { handler } of handlers) {
      await handler(compilation.assets);
    }
    done();
  };
  const compiler = {
    hooks: {
      compilation: {
        tap(_: unknown, fn: (compilation: Compilation) => void) {
          fn(compilation as unknown as Compilation);
          void runProcessAssetsHandlers();
        },
      },
    },
    webpack: {
      sources: { SourceMapSource, RawSource },
    },
  } as Compiler;
  return {
    compiler,
    compilation: compilation as Compilation & typeof compilation,
    promise,
  };
}
