import { describe, it } from 'node:test';
import assert from 'node:assert';
import type { Chunk } from 'webpack';
import type { Args } from '../utils/cli';
import {
  lavamoatPlugin,
  lavamoatUnsafeLayerRule,
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

const mockChunk = ({
  name,
  chunkLoading,
  files = [],
}: {
  name?: string;
  chunkLoading?: string;
  files?: string[];
}): Chunk =>
  ({
    name,
    files: new Set(files),
    getEntryOptions: () =>
      chunkLoading === undefined ? undefined : { chunkLoading },
  }) as unknown as Chunk;

describe('LavamoatPlugin', () => {
  describe('lavamoatPlugin – runtimeConfigurationPerChunk_experimental', () => {
    // Access the internal options via the public `this.options` property that
    // LavaMoatPlugin stores on every instance.
    const plugin = lavamoatPlugin(mockArgs) as unknown as {
      options: {
        runtimeConfigurationPerChunk_experimental: (chunk: Chunk) => unknown;
        inlineLockdown: { test: (filename: string) => boolean };
      };
    };
    const runtimeConfig =
      plugin.options.runtimeConfigurationPerChunk_experimental;
    const { inlineLockdown } = plugin.options;

    it('configures import-scripts entries as protected execution roots', () => {
      const result = runtimeConfig(
        mockChunk({
          name: 'renamed-worker.ts',
          chunkLoading: 'import-scripts',
          files: ['renamed-worker.js'],
        }),
      ) as {
        mode: string;
        embeddedOptions?: {
          scuttleGlobalThis?: {
            enabled: boolean;
            exceptions: (string | RegExp)[];
          };
        };
      };

      assert.strictEqual(result.mode, 'safe');
      const exceptions =
        result.embeddedOptions?.scuttleGlobalThis?.exceptions ?? [];
      assert.ok(
        result.embeddedOptions?.scuttleGlobalThis?.enabled,
        'scuttleGlobalThis should be enabled for the service worker',
      );
      assert.ok(
        exceptions.includes('importScripts'),
        'importScripts must be in the exceptions list so the worker can load background.js',
      );
      assert.ok(
        exceptions.includes('addEventListener'),
        'Sentry must be able to register service worker event listeners',
      );
      assert.ok(inlineLockdown.test('renamed-worker.js'));
    });

    it('inlines SES into content script and shared runtime output files', () => {
      for (const [name, filename] of [
        ['scripts/contentscript.js', 'scripts/contentscript.js'],
        ['runtime', 'runtime.0123456789abcdefghij.js'],
      ]) {
        runtimeConfig(mockChunk({ name, files: [filename] }));
        assert.ok(inlineLockdown.test(filename));
      }
      assert.ok(!inlineLockdown.test('unrelated.js'));
    });

    it('scuttles the content script with its required globals available', () => {
      const result = runtimeConfig(
        mockChunk({ name: 'scripts/contentscript.js' }),
      ) as {
        mode: string;
        embeddedOptions: {
          scuttleGlobalThis: {
            enabled: boolean;
            exceptions: string[];
          };
        };
      };

      assert.strictEqual(result.mode, 'safe');
      assert.deepStrictEqual(result.embeddedOptions.scuttleGlobalThis, {
        enabled: true,
        exceptions: ['browser', 'chrome', 'btoa'],
      });
    });

    it('configures the shared runtime with Snow shims only when enabled', () => {
      const result = runtimeConfig(mockChunk({ name: 'runtime' })) as {
        mode: string;
        staticShims: string[];
      };
      assert.strictEqual(result.mode, 'safe');
      assert.deepStrictEqual(result.staticShims, []);

      const snowPlugin = lavamoatPlugin({
        ...mockArgs,
        snow: true,
      }) as unknown as {
        options: {
          runtimeConfigurationPerChunk_experimental: (chunk: Chunk) => unknown;
          scuttleGlobalThis: { scuttlerName?: string };
        };
      };
      const snowResult =
        snowPlugin.options.runtimeConfigurationPerChunk_experimental(
          mockChunk({ name: 'runtime' }),
        ) as { staticShims: string[] };

      assert.strictEqual(
        snowPlugin.options.scuttleGlobalThis.scuttlerName,
        'SCUTTLER',
      );
      assert.strictEqual(snowResult.staticShims.length, 2);
      assert.ok(snowResult.staticShims[0].endsWith('/snow.prod.js'));
      assert.ok(snowResult.staticShims[1].endsWith('/app/scripts/use-snow.js'));
    });

    it('keeps null_unsafe mode for inpage.js and bootstrap (no LavaMoat runtime needed)', () => {
      for (const name of ['scripts/inpage.js', 'bootstrap']) {
        const result = runtimeConfig(mockChunk({ name })) as { mode: string };
        assert.strictEqual(
          result.mode,
          'null_unsafe',
          `${name} should remain null_unsafe`,
        );
      }
    });

    it('uses safe mode for unrecognised chunks', () => {
      const result = runtimeConfig(mockChunk({ name: 'some-other-chunk' })) as {
        mode: string;
      };
      assert.strictEqual(result.mode, 'safe');
    });
  });

  describe('lavamoatUnsafeLayerPlugin', () => {
    it('pushes the unsafe-layer rule and assigns unsafe entries to it', () => {
      const rules: unknown[] = [];
      let thisCompilationCallback:
        | ((compilation: Record<string, unknown>) => void)
        | undefined;
      const mockCompiler = {
        options: { module: { rules } },
        hooks: {
          thisCompilation: {
            tap: (
              _name: string,
              callback: (compilation: Record<string, unknown>) => void,
            ) => {
              thisCompilationCallback = callback;
            },
          },
        },
      };

      lavamoatUnsafeLayerPlugin.apply(mockCompiler as never);

      assert.ok(
        rules.includes(lavamoatUnsafeLayerRule),
        'should register the unsafe-layer exclude rule',
      );

      let addEntryCallback:
        | ((entry: { request: string }, options: { name: string }) => void)
        | undefined;
      const unsafeEntry = {
        options: { layer: undefined as string | undefined },
      };
      const safeEntry = { options: { layer: undefined as string | undefined } };
      const compilation = {
        hooks: {
          addEntry: {
            tap: (
              _name: string,
              callback: (
                entry: { request: string },
                options: { name: string },
              ) => void,
            ) => {
              addEntryCallback = callback;
            },
          },
        },
        entries: new Map([
          ['scripts/inpage.js', unsafeEntry],
          ['safe-entry', safeEntry],
        ]),
      };

      assert.ok(thisCompilationCallback);
      thisCompilationCallback(compilation);
      assert.ok(addEntryCallback);
      addEntryCallback({ request: './inpage' }, { name: 'scripts/inpage.js' });
      addEntryCallback({ request: './safe' }, { name: 'safe-entry' });

      assert.strictEqual(
        unsafeEntry.options.layer,
        lavamoatUnsafeLayerRule.issuerLayer,
      );
      assert.strictEqual(safeEntry.options.layer, undefined);
    });
  });
});
