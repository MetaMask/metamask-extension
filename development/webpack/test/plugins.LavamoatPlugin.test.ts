import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import type { Chunk } from 'webpack';
import type { Args } from '../utils/cli';
import {
  lavamoatPlugin,
  lavamoatUnsafeLayerRule,
  lavamoatBackgroundLayerRule,
  lavamoatUnsafeLayerPlugin,
} from '../utils/plugins/LavamoatPlugin';

const mockArgs = {
  test: false,
  snow: false,
  manifestVersion: 3,
  type: 'main',
  lavamoatDebug: false,
  generatePolicy: false,
} as unknown as Args;

const mockChunk = (
  name: string | undefined,
  files = new Set<string>(),
): Chunk => ({ name, files }) as unknown as Chunk;

type ResourcePolicy = {
  globals?: Record<string, boolean | 'write'>;
  packages?: Record<string, boolean>;
  builtin?: Record<string, boolean>;
};
type Policy = { resources: Record<string, ResourcePolicy> };

describe('LavamoatPlugin', () => {
  describe('lavamoatUnsafeLayerRule', () => {
    it('excludes background entry from the unsafe LavaMoat exclude-loader', () => {
      const { exclude } = lavamoatUnsafeLayerRule;
      assert.ok(exclude instanceof RegExp, 'exclude should be a RegExp');

      // The paths that must be excluded from the unsafe loader so LavaMoat wraps them.
      assert.ok(
        exclude.test('/project/app/scripts/background.js'),
        'should exclude Unix-style background.js path',
      );
      assert.ok(
        exclude.test('/project/app/scripts/background.ts'),
        'should exclude Unix-style background.ts path',
      );
      assert.ok(
        exclude.test('C:\\project\\app\\scripts\\background.js'),
        'should exclude Windows-style background.js path',
      );
      assert.ok(
        exclude.test('C:\\project\\app\\scripts\\background.ts'),
        'should exclude Windows-style background.ts path',
      );
    });

    it('does not exclude other scripts', () => {
      const { exclude } = lavamoatUnsafeLayerRule;
      assert.ok(exclude instanceof RegExp, 'exclude should be a RegExp');

      assert.ok(
        !exclude.test('/project/app/scripts/ui.js'),
        'should not exclude ui.js',
      );
      assert.ok(
        !exclude.test('/project/app/scripts/contentscript.js'),
        'should not exclude contentscript.js',
      );
      assert.ok(
        !exclude.test('/project/app/scripts/background-worker.js'),
        'should not exclude files with background in a different position',
      );
    });
  });

  describe('lavamoatBackgroundLayerRule', () => {
    it('re-layers background.js out of the unsafe layer', () => {
      assert.strictEqual(
        lavamoatBackgroundLayerRule.issuerLayer,
        'unsafe',
        'should only apply when issued from the unsafe layer',
      );
      assert.strictEqual(
        lavamoatBackgroundLayerRule.layer,
        'background',
        'should assign background.js to the background layer',
      );
    });

    it('matches only the background entry module', () => {
      const { test } = lavamoatBackgroundLayerRule;
      assert.ok(test instanceof RegExp, 'test should be a RegExp');

      assert.ok(
        test.test('/project/app/scripts/background.js'),
        'should match Unix-style background.js path',
      );
      assert.ok(
        test.test('/project/app/scripts/background.ts'),
        'should match Unix-style background.ts path',
      );
      assert.ok(
        test.test('C:\\project\\app\\scripts\\background.js'),
        'should match Windows-style background.js path',
      );
      assert.ok(
        test.test('C:\\project\\app\\scripts\\background.ts'),
        'should match Windows-style background.ts path',
      );
      assert.ok(
        !test.test('/project/app/scripts/ui.js'),
        'should not match ui.js',
      );
    });
  });

  describe('lavamoatPlugin – runtimeConfigurationPerChunk_experimental', () => {
    // Access the internal options via the public `this.options` property that
    // LavaMoatPlugin stores on every instance.
    const plugin = lavamoatPlugin(mockArgs) as unknown as {
      options: {
        inlineLockdown: RegExp;
        runtimeConfigurationPerChunk_experimental: (chunk: Chunk) => unknown;
      };
    };
    const runtimeConfig =
      plugin.options.runtimeConfigurationPerChunk_experimental;

    it('gives service-worker.ts chunk safe mode (regression guard)', () => {
      // Before the fix, service-worker.ts was in nullUnsafeEntries and got
      // null_unsafe mode, so background.js had no LavaMoat runtime to run against.
      const result = runtimeConfig(mockChunk('service-worker.ts')) as {
        mode: string;
        embeddedOptions?: {
          scuttleGlobalThis?: { enabled: boolean; exceptions: string[] };
        };
      };

      assert.strictEqual(
        result.mode,
        'safe',
        'service-worker.ts must use safe mode so its LavaMoat runtime is available to background.js',
      );
    });

    it('includes importScripts in service-worker.ts scuttleGlobalThis exceptions', () => {
      const result = runtimeConfig(mockChunk('service-worker.ts')) as {
        embeddedOptions?: {
          scuttleGlobalThis?: {
            enabled: boolean;
            exceptions: (string | RegExp)[];
          };
        };
      };

      const exceptions =
        result.embeddedOptions?.scuttleGlobalThis?.exceptions ?? [];
      assert.ok(
        result.embeddedOptions?.scuttleGlobalThis?.enabled,
        'scuttleGlobalThis should be enabled for the service worker',
      );
      assert.ok(
        exceptions.includes('importScripts'),
        'importScripts must be in the SW exceptions list so the SW can load background.js',
      );
      assert.ok(
        exceptions.includes('Headers'),
        'Headers must be in the SW exceptions list, or fetch trace headers are dropped',
      );
    });

    it('keeps null_unsafe mode for inpage.js and bootstrap (no LavaMoat runtime needed)', () => {
      for (const name of ['scripts/inpage.js', 'bootstrap']) {
        const result = runtimeConfig(mockChunk(name)) as { mode: string };
        assert.strictEqual(
          result.mode,
          'null_unsafe',
          `${name} should remain null_unsafe`,
        );
      }
    });

    it('inlines lockdown for the emitted service worker, content script and shared runtime', () => {
      for (const [name, filename] of [
        ['service-worker.ts', 'service-worker.js'],
        ['scripts/contentscript.js', 'scripts/contentscript.js'],
        ['runtime', 'runtime.custom-hash.js'],
      ] as const) {
        runtimeConfig(mockChunk(name, new Set([filename])));
        assert.ok(plugin.options.inlineLockdown.test(filename));
      }
    });

    it('inlines lockdown and scuttles discovered workers without exceptions', () => {
      const isolates = new Set<string>();
      const isolatedWorkerPlugin = lavamoatPlugin(mockArgs, {
        isolates,
      }) as unknown as typeof plugin;
      isolates.add('workers/example.worker.ts');
      const {
        inlineLockdown,
        runtimeConfigurationPerChunk_experimental: workerRuntimeConfig,
      } = isolatedWorkerPlugin.options;
      const files = new Set<string>();
      assert.deepStrictEqual(
        workerRuntimeConfig(mockChunk('workers/example.worker.ts', files)),
        {
          mode: 'safe',
          embeddedOptions: {
            scuttleGlobalThis: { enabled: true, exceptions: [] },
          },
        },
      );

      const filename = 'workers/example.worker.emitted.js';
      assert.ok(!inlineLockdown.test(filename));
      files.add(filename);
      files.add(`${filename}.map`);
      assert.ok(inlineLockdown.test(filename));
      assert.ok(!inlineLockdown.test(`${filename}.map`));
      assert.ok(!inlineLockdown.test('workers/example.worker.js'));
      assert.deepStrictEqual(
        workerRuntimeConfig(
          mockChunk(
            'workers/unlisted.worker.ts',
            new Set(['workers/unlisted.worker.js']),
          ),
        ),
        { mode: 'safe' },
      );
      assert.ok(!inlineLockdown.test('workers/unlisted.worker.js'));
    });

    it('inlines lockdown and keeps browser exceptions for isolated HTML scripts', () => {
      const framePlugin = lavamoatPlugin(mockArgs, {
        isolates: new Set(['frame']),
      }) as unknown as typeof plugin;
      const filename = 'html/frame.custom-hash.js';
      const result =
        framePlugin.options.runtimeConfigurationPerChunk_experimental(
          mockChunk('frame', new Set([filename])),
        ) as {
          mode: string;
          embeddedOptions?: {
            scuttleGlobalThis?: {
              enabled: boolean;
              exceptions: (string | RegExp)[];
            };
          };
        };

      const scuttle = result.embeddedOptions?.scuttleGlobalThis;
      assert.strictEqual(result.mode, 'safe');
      assert.ok(scuttle?.enabled);
      for (const exception of ['Headers', 'browser', 'chrome']) {
        assert.ok(scuttle.exceptions.includes(exception));
      }
      assert.ok(framePlugin.options.inlineLockdown.test(filename));
    });

    it('uses safe mode for unrecognised chunks', () => {
      const result = runtimeConfig(mockChunk('some-other-chunk')) as {
        mode: string;
      };
      assert.strictEqual(result.mode, 'safe');
    });
  });

  describe('Braze SDK grants', () => {
    const requireFromLavaMoat = createRequire(
      require.resolve('@lavamoat/webpack'),
    );
    const { mergePolicy } = requireFromLavaMoat('lavamoat-core') as {
      mergePolicy: (base: Policy, override: Policy) => Policy;
    };

    for (const variant of ['main', 'beta', 'flask', 'experimental']) {
      it(`limits Braze in ${variant} to worker shims and harmless built-ins`, () => {
        const policyDir = resolve(
          __dirname,
          '../../../lavamoat/webpack/mv3',
          variant,
        );
        const { resources } = mergePolicy(
          requireFromLavaMoat(resolve(policyDir, 'policy.json')),
          requireFromLavaMoat(resolve(policyDir, 'policy-override.json')),
        );
        const sdk = resources['@braze/web-sdk'];
        const grants = Object.entries(sdk.globals ?? {}).filter(
          ([, value]) => value !== false,
        );
        assert.ok(
          grants.every(([, value]) => value === true),
          'globals are read-only',
        );
        assert.deepStrictEqual(grants.map(([name]) => name).sort(), [
          'CustomEvent',
          'Intl',
          'XMLHttpRequest',
          'addEventListener',
          'atob',
          'btoa',
          'clearInterval',
          'clearTimeout',
          'crypto.getRandomValues',
          'dispatchEvent',
          'document',
          'innerHeight',
          'innerWidth',
          'localStorage',
          'location',
          'navigator',
          'orientation',
          'removeEventListener',
          'screen.height',
          'screen.mozOrientation',
          'screen.msOrientation',
          'screen.width',
          'setInterval',
          'setTimeout',
        ]);
        assert.deepStrictEqual(sdk.packages ?? {}, {});
        assert.deepStrictEqual(sdk.builtin ?? {}, {});
      });
    }
  });

  describe('lavamoatUnsafeLayerPlugin', () => {
    it('pushes both the unsafe-layer rule and the background re-layer rule', () => {
      const rules: unknown[] = [];
      const mockCompiler = {
        options: { module: { rules } },
        hooks: {
          thisCompilation: {
            tap: (_name: string, _cb: unknown) => undefined,
          },
        },
      };

      lavamoatUnsafeLayerPlugin.apply(mockCompiler as never);

      assert.ok(
        rules.includes(lavamoatUnsafeLayerRule),
        'should register the unsafe-layer exclude rule',
      );
      assert.ok(
        rules.includes(lavamoatBackgroundLayerRule),
        'should register the background re-layer rule',
      );
    });
  });
});
