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
  const initialFileOrder = new Map(files.map((file, index) => [file, index]));

  function splitAssetPath(name: string) {
    const separatorIndex = name.indexOf('/');
    if (separatorIndex === -1) {
      return { root: '', path: name };
    }
    return {
      root: name.slice(0, separatorIndex),
      path: name.slice(separatorIndex + 1),
    };
  }

  function compareAssetNames(
    x: string,
    y: string,
    browserOrder: string[],
  ): number {
    const xParts = splitAssetPath(x);
    const yParts = splitAssetPath(y);
    const xBrowserIndex = browserOrder.indexOf(xParts.root);
    const yBrowserIndex = browserOrder.indexOf(yParts.root);

    const getPathRank = (
      assetPath: { root: string; path: string },
      browserIndex: number,
    ) => {
      if (browserIndex !== -1) {
        if (assetPath.path === 'manifest.json') {
          return 0;
        }
        return 1;
      }
      return 0;
    };

    const getAssetGroupRank = (
      assetPath: { root: string; path: string },
      browserIndex: number,
    ) => {
      if (browserIndex !== -1) {
        if (assetPath.path.endsWith('.zip')) {
          return 0;
        }
        return 1;
      }
      if (assetPath.root === 'sourcemaps') {
        return 2;
      }
      return 3;
    };

    const xGroupRank = getAssetGroupRank(xParts, xBrowserIndex);
    const yGroupRank = getAssetGroupRank(yParts, yBrowserIndex);
    if (xGroupRank !== yGroupRank) {
      return xGroupRank - yGroupRank;
    }

    if (xBrowserIndex !== yBrowserIndex) {
      if (xBrowserIndex !== -1 && yBrowserIndex !== -1) {
        return xBrowserIndex - yBrowserIndex;
      }
      if (xBrowserIndex !== -1) {
        return -1;
      }
      if (yBrowserIndex !== -1) {
        return 1;
      }
    }

    const xPathRank = getPathRank(xParts, xBrowserIndex);
    const yPathRank = getPathRank(yParts, yBrowserIndex);
    if (xPathRank !== yPathRank) {
      return xPathRank - yPathRank;
    }

    const xFileIndex =
      initialFileOrder.get(xParts.path) ?? Number.MAX_SAFE_INTEGER;
    const yFileIndex =
      initialFileOrder.get(yParts.path) ?? Number.MAX_SAFE_INTEGER;
    if (xFileIndex !== yFileIndex) {
      return xFileIndex - yFileIndex;
    }

    return x.localeCompare(y);
  }

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
  const compilation = {
    get assets() {
      const assetNames = Object.keys(assets);
      const browserOrder: string[] = [];
      for (const name of assetNames) {
        const { root, path } = splitAssetPath(name);
        if (
          root &&
          (path === 'manifest.json' || path.endsWith('.zip')) &&
          !browserOrder.includes(root)
        ) {
          browserOrder.push(root);
        }
      }

      const orderedEntries = Object.entries(assets).sort(([x], [y]) =>
        compareAssetNames(x, y, browserOrder),
      );
      return Object.fromEntries(
        orderedEntries.map(([name, asset]) => [name, asset.source]),
      );
    },
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
    deleteAsset: mock.fn((name: string) => {
      delete assets[name];
    }),
    hooks: {
      processAssets: {
        async tapPromise(_: unknown, fn: (assets: Assets) => Promise<void>) {
          await fn(compilation.assets);
          done();
        },
        tap(_: unknown, fn: (assets: Assets) => void) {
          fn(compilation.assets);
          done();
        },
      },
    },
  };
  const compiler = {
    hooks: {
      compilation: {
        tap(_: unknown, fn: (compilation: Compilation) => void) {
          fn(compilation as unknown as Compilation);
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
