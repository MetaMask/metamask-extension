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

    it('configures manifest-derived import-scripts entries as protected execution roots', () => {
      const chunk = mockChunk({
        name: 'renamed-worker.ts',
        chunkLoading: 'import-scripts',
        files: ['renamed-worker.js'],
      });
      const result = runtimeConfig(chunk) as {
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
        'importScripts must remain available to the Webpack chunk loader',
      );
      assert.ok(inlineLockdown.test('renamed-worker.js'));
      assert.ok(!inlineLockdown.test('unrelated.js'));
    });

    it('inlines SES into content script and shared runtime output files', () => {
      for (const [name, filename] of [
        ['scripts/contentscript.js', 'scripts/contentscript.js'],
        ['runtime', 'runtime.0123456789abcdefghij.js'],
      ]) {
        runtimeConfig(mockChunk({ name, files: [filename] }));
        assert.ok(inlineLockdown.test(filename));
      }
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
      const result = runtimeConfig(
        mockChunk({
          name: 'some-other-chunk',
        }),
      ) as {
        mode: string;
      };
      assert.strictEqual(result.mode, 'safe');
    });
  });

  describe('lavamoatUnsafeLayerPlugin', () => {
    it('pushes the unsafe-layer rule', () => {
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
    });
  });
});
