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
  sentry: true,
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
        staticShims: string[];
        embeddedOptions?: {
          scuttleGlobalThis?: {
            enabled: boolean;
            exceptions: (string | RegExp)[];
          };
        };
      };

      assert.strictEqual(result.mode, 'safe');
      assert.strictEqual(result.staticShims.length, 2);
      assert.ok(
        result.staticShims[0].endsWith(
          '/app/scripts/load/set-sentry-stack-trace-limit.ts',
        ),
      );
      assert.ok(
        result.staticShims[1].endsWith('/app/scripts/load/init-state-hooks.ts'),
      );
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
      assert.ok(
        exceptions.includes('addEventListener'),
        'Sentry must be able to register service worker event listeners',
      );
      assert.ok(inlineLockdown.test('service-worker.js'));
    });

    it('inlines SES into content script and shared runtime output files', () => {
      assert.ok(inlineLockdown.test('scripts/contentscript.js'));
      assert.ok(inlineLockdown.test('runtime.0123456789abcdefghab.js'));
      assert.ok(!inlineLockdown.test('unrelated.js'));
    });

    it('scuttles the content script with its required globals available', () => {
      const result = runtimeConfig(mockChunk('scripts/contentscript.js')) as {
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
      const result = runtimeConfig(mockChunk('runtime')) as {
        mode: string;
        staticShims: string[];
      };
      assert.strictEqual(result.mode, 'safe');
      assert.strictEqual(result.staticShims.length, 1);
      assert.ok(
        result.staticShims[0].endsWith(
          '/app/scripts/load/set-sentry-stack-trace-limit.ts',
        ),
      );

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
          mockChunk('runtime'),
        ) as { staticShims: string[] };

      assert.strictEqual(
        snowPlugin.options.scuttleGlobalThis.scuttlerName,
        'SCUTTLER',
      );
      assert.strictEqual(snowResult.staticShims.length, 3);
      assert.ok(
        snowResult.staticShims[0].endsWith(
          '/app/scripts/load/set-sentry-stack-trace-limit.ts',
        ),
      );
      assert.ok(snowResult.staticShims[1].endsWith('/snow.prod.js'));
      assert.ok(snowResult.staticShims[2].endsWith('/app/scripts/use-snow.js'));
    });

    it('omits the Sentry shim when Sentry is disabled', () => {
      const disabledPlugin = lavamoatPlugin({
        ...mockArgs,
        sentry: false,
      }) as unknown as {
        options: {
          runtimeConfigurationPerChunk_experimental: (chunk: Chunk) => unknown;
        };
      };
      const disabledRuntimeConfig =
        disabledPlugin.options.runtimeConfigurationPerChunk_experimental;

      const runtimeResult = disabledRuntimeConfig(mockChunk('runtime')) as {
        staticShims: string[];
      };
      assert.deepStrictEqual(runtimeResult.staticShims, []);

      const serviceWorkerResult = disabledRuntimeConfig(
        mockChunk('service-worker.ts'),
      ) as { staticShims: string[] };
      assert.strictEqual(serviceWorkerResult.staticShims.length, 1);
      assert.ok(
        serviceWorkerResult.staticShims[0].endsWith(
          '/app/scripts/load/init-state-hooks.ts',
        ),
      );
    });

    it('keeps null_unsafe mode for the host-realm entries', () => {
      for (const name of ['scripts/inpage.js', 'init-state-hooks']) {
        const result = runtimeConfig(mockChunk(name)) as { mode: string };
        assert.strictEqual(
          result.mode,
          'null_unsafe',
          `${name} should remain null_unsafe`,
        );
      }

      assert.deepStrictEqual(runtimeConfig(mockChunk('bootstrap')), {
        mode: 'safe',
      });
    });

    it('uses safe mode for unrecognised chunks', () => {
      const result = runtimeConfig(mockChunk('some-other-chunk')) as {
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
      const stateHooksEntry = {
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
          ['init-state-hooks', stateHooksEntry],
          ['safe-entry', safeEntry],
        ]),
      };

      assert.ok(thisCompilationCallback);
      thisCompilationCallback(compilation);
      assert.ok(addEntryCallback);
      addEntryCallback({ request: './inpage' }, { name: 'scripts/inpage.js' });
      addEntryCallback(
        { request: './init-state-hooks' },
        { name: 'init-state-hooks' },
      );
      addEntryCallback({ request: './safe' }, { name: 'safe-entry' });

      assert.strictEqual(
        unsafeEntry.options.layer,
        lavamoatUnsafeLayerRule.issuerLayer,
      );
      assert.strictEqual(
        stateHooksEntry.options.layer,
        lavamoatUnsafeLayerRule.issuerLayer,
      );
      assert.strictEqual(safeEntry.options.layer, undefined);
    });
  });
});
