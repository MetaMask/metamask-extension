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

const mockChunk = (name: string | undefined): Chunk =>
  ({ name }) as unknown as Chunk;

describe('LavamoatPlugin', () => {
  describe('lavamoatPlugin – runtimeConfigurationPerChunk_experimental', () => {
    // Access the internal options via the public `this.options` property that
    // LavaMoatPlugin stores on every instance.
    const plugin = lavamoatPlugin(mockArgs) as unknown as {
      options: {
        runtimeConfigurationPerChunk_experimental: (chunk: Chunk) => unknown;
        inlineLockdown: RegExp;
      };
    };
    const runtimeConfig =
      plugin.options.runtimeConfigurationPerChunk_experimental;
    const { inlineLockdown } = plugin.options;

    it('configures the service worker as a protected execution root', () => {
      const result = runtimeConfig(mockChunk('service-worker.ts')) as {
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
      assert.ok(inlineLockdown.test('service-worker.js'));
    });

    it('inlines SES into content script and shared runtime output files', () => {
      assert.ok(inlineLockdown.test('scripts/contentscript.js'));
      assert.ok(inlineLockdown.test('runtime.0123456789abcdefghab.js'));
      assert.ok(!inlineLockdown.test('unrelated.js'));
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

    it('uses safe mode for unrecognised chunks', () => {
      const result = runtimeConfig(mockChunk('some-other-chunk')) as {
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
