import assert from 'node:assert/strict';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { EntryPlugin, webpack, type Configuration, type Stats } from 'webpack';
import { brazeWorkerIsolationPlugin } from '../utils/plugins/LavamoatPlugin';
import { getSwcLoader } from '../utils/loaders/getSwcLoader';

type GlobalsPolicy = Record<string, boolean | 'write'>;
type Policy = {
  resources: Record<string, { globals?: GlobalsPolicy }>;
};

const MANIFESTS = ['mv2', 'mv3'] as const;
const VARIANTS = ['main', 'beta', 'flask', 'experimental'] as const;

/**
 * Capabilities the SDK must not have. This is the security contract, not a copy
 * of the policy: granting one of these breaks identity or banner containment
 * (see "LavaMoat policy" and "Security" in `app/braze/braze.md`).
 */
const DENIED_GLOBALS = [
  'Document',
  'DOMParser',
  'Element',
  'EventSource',
  'Node',
  'Notification',
  'ServiceWorkerRegistration',
  'Worker',
  'SharedWorker',
  'atob',
  'btoa',
  'innerHeight',
  'innerWidth',
  'localStorage',
  'open',
  'orientation',
  'safari',
  'chrome',
  'browser',
  'postMessage',
];

// These grants apply only inside braze-worker. document and navigator are
// compatibility facades installed before the SDK loads, never page objects.
const ALLOWED_GLOBALS = new Set([
  'CustomEvent',
  'Intl.DateTimeFormat',
  'XMLHttpRequest',
  'addEventListener',
  'clearInterval',
  'clearTimeout',
  'console.error',
  'console.log',
  'console.warn',
  'crypto.getRandomValues',
  'dispatchEvent',
  'document',
  'location.href',
  'navigator',
  'removeEventListener',
  'screen.height',
  'screen.width',
  'setInterval',
  'setTimeout',
]);

const readGlobals = (
  manifest: (typeof MANIFESTS)[number],
  variant: (typeof VARIANTS)[number],
  filename: string,
): GlobalsPolicy => {
  const path = resolve(
    __dirname,
    `../../../lavamoat/webpack/${manifest}/${variant}/${filename}.json`,
  );
  const policy = JSON.parse(readFileSync(path, 'utf8')) as Policy;
  return policy.resources['@braze/web-sdk'].globals ?? {};
};

const mergedGlobals = (
  manifest: (typeof MANIFESTS)[number],
  variant: (typeof VARIANTS)[number],
): GlobalsPolicy => ({
  ...readGlobals(manifest, variant, 'policy'),
  ...readGlobals(manifest, variant, 'policy-override'),
});

describe('Braze worker confinement', () => {
  async function compile(entry: string, workerEntry: boolean): Promise<Stats> {
    const directory = mkdtempSync(join(tmpdir(), 'braze-worker-test-'));
    const root = resolve(__dirname, '../../..');
    const config: Configuration = {
      context: root,
      mode: 'production',
      target: 'web',
      entry: { page: resolve(root, entry) },
      output: {
        path: directory,
        filename: '[name].js',
        publicPath: '',
        library: { type: 'commonjs2' },
      },
      resolve: { extensions: ['.ts', '.js'] },
      module: {
        rules: [
          {
            test: /\.ts$/u,
            use: getSwcLoader(
              'typescript',
              false,
              {},
              {
                browsersListQuery: 'defaults',
                isDevelopment: false,
                refresh: false,
              },
            ),
          },
        ],
      },
      optimization: { minimize: false },
      plugins: [
        brazeWorkerIsolationPlugin,
        ...(workerEntry
          ? [
              new EntryPlugin(root, './app/braze/braze-worker.ts', {
                name: 'braze-worker',
                filename: 'braze-worker.js',
                runtime: false,
                chunkLoading: 'import-scripts',
                wasmLoading: 'fetch',
              }),
            ]
          : []),
      ],
    };
    const compiler = webpack(config);
    assert.ok(compiler);
    try {
      return await new Promise<Stats>((resolveBuild, reject) => {
        compiler.run((error, stats) => {
          if (error) {
            reject(error);
          } else if (stats) {
            resolveBuild(stats);
          } else {
            reject(new Error('Webpack returned no stats'));
          }
        });
      });
    } finally {
      await new Promise<void>((resolveClose, reject) =>
        compiler.close((error) => (error ? reject(error) : resolveClose())),
      );
      rmSync(directory, { recursive: true, force: true });
    }
  }

  it('bundles the real SDK exclusively in the worker without LavaMoat', async () => {
    const stats = await compile('app/braze/braze-host.ts', true);

    assert.equal(
      stats.hasErrors(),
      false,
      stats.toString({ all: false, errors: true }),
    );
    assert.ok(stats.compilation.entrypoints.get('braze-worker'));
  });

  it('rejects a page import even when the worker also exists', async () => {
    const stats = await compile('app/braze/braze-sdk.ts', true);

    assert.equal(stats.hasErrors(), true);
    assert.match(
      stats.toString({ all: false, errors: true }),
      /Braze SDK must be bundled exclusively in braze-worker/u,
    );
  });

  it('rejects an SDK bundle without the worker entry', async () => {
    const stats = await compile('app/braze/braze-sdk.ts', false);

    assert.equal(stats.hasErrors(), true);
    assert.match(
      stats.toString({ all: false, errors: true }),
      /Braze SDK must be bundled exclusively in braze-worker/u,
    );
  });

  it('rejects a future SDK concatenated into an application module', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'braze-concatenation-test-'));
    const sdkDirectory = join(directory, 'node_modules/@braze/web-sdk');
    mkdirSync(sdkDirectory, { recursive: true });
    writeFileSync(
      join(sdkDirectory, 'index.ts'),
      'export const node = document.createElement("script");',
    );
    writeFileSync(
      join(directory, 'page.ts'),
      'export { node } from "./node_modules/@braze/web-sdk/index";',
    );
    try {
      const stats = await compile(join(directory, 'page.ts'), false);

      assert.ok(
        [...stats.compilation.modules].some(
          (module) =>
            'modules' in module &&
            Array.isArray(module.modules) &&
            module.modules.length > 1,
        ),
        'fixture must exercise module concatenation',
      );
      assert.equal(stats.hasErrors(), true);
      assert.match(
        stats.toString({ all: false, errors: true }),
        /Braze SDK must be bundled exclusively in braze-worker/u,
      );
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});

describe('Braze LavaMoat policy', () => {
  it('applies the same policy in every build variant', () => {
    const shapes = new Set(
      MANIFESTS.flatMap((manifest) =>
        VARIANTS.map((variant) =>
          JSON.stringify(
            Object.entries(mergedGlobals(manifest, variant)).sort(
              ([left], [right]) => left.localeCompare(right),
            ),
          ),
        ),
      ),
    );

    assert.equal(
      shapes.size,
      1,
      'the @braze/web-sdk policy drifted between build variants',
    );
  });

  it('keeps the denied capabilities denied in every build variant', () => {
    for (const manifest of MANIFESTS) {
      for (const variant of VARIANTS) {
        const globals = mergedGlobals(manifest, variant);

        for (const name of DENIED_GLOBALS) {
          assert.equal(
            globals[name] === true || globals[name] === 'write',
            false,
            `${manifest}/${variant} grants ${name}; see app/braze/braze.md`,
          );
        }
      }
    }
  });

  it('requires explicit review for every new SDK global capability', () => {
    for (const manifest of MANIFESTS) {
      for (const variant of VARIANTS) {
        for (const [name, permission] of Object.entries(
          mergedGlobals(manifest, variant),
        )) {
          if (permission === true || permission === 'write') {
            assert.ok(
              ALLOWED_GLOBALS.has(name),
              `${manifest}/${variant} newly grants ${name}`,
            );
          }
        }
      }
    }
  });
});
