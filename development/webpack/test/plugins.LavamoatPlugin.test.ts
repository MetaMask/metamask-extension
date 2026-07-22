import { describe, it } from 'node:test';
import assert from 'node:assert';
import type { Chunk } from 'webpack';
import type { Args } from '../utils/cli';
import {
  lavamoatPlugin,
  lavamoatUnsafeLayerRule,
  lavamoatBackgroundLayerRule,
  lavamoatUnsafeLayerPlugin,
  nullUnsafeEntries,
  unsafeLayerEntries,
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
  describe('lavamoatUnsafeLayerRule', () => {
    it('excludes background.js from the unsafe LavaMoat exclude-loader', () => {
      const { exclude } = lavamoatUnsafeLayerRule;
      assert.ok(exclude instanceof RegExp, 'exclude should be a RegExp');

      // The paths that must be excluded from the unsafe loader so LavaMoat wraps them.
      assert.ok(
        exclude.test('/project/app/scripts/background.js'),
        'should exclude Unix-style background.js path',
      );
      assert.ok(
        exclude.test('C:\\project\\app\\scripts\\background.js'),
        'should exclude Windows-style background.js path',
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

    it('matches only background.js', () => {
      const { test } = lavamoatBackgroundLayerRule;
      assert.ok(test instanceof RegExp, 'test should be a RegExp');

      assert.ok(
        test.test('/project/app/scripts/background.js'),
        'should match Unix-style background.js path',
      );
      assert.ok(
        test.test('C:\\project\\app\\scripts\\background.js'),
        'should match Windows-style background.js path',
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
    });

    it('keeps null_unsafe mode for inpage.js, bootstrap, and cashtag content (no LavaMoat runtime needed)', () => {
      for (const name of [
        'scripts/inpage.js',
        'bootstrap',
        'scripts/cashtag/content.ts',
        'scripts/cashtag/content.js',
      ]) {
        const result = runtimeConfig(mockChunk(name)) as { mode: string };
        assert.strictEqual(
          result.mode,
          'null_unsafe',
          `${name} should remain null_unsafe`,
        );
      }
    });

    it('puts every null_unsafe entry on the unsafe layer so modules are not wrapped with _LM_', () => {
      for (const name of nullUnsafeEntries) {
        assert.ok(
          unsafeLayerEntries.has(name),
          `${name} is null_unsafe but not unsafe-layered; runtime would miss _LM_`,
        );
      }
      assert.ok(
        unsafeLayerEntries.has('service-worker.ts'),
        'service-worker must stay on the unsafe layer',
      );
    });

    it('disables contentscript world scuttling so sibling content scripts can use globals', () => {
      const result = runtimeConfig(mockChunk('scripts/contentscript.js')) as {
        mode: string;
        embeddedOptions?: {
          scuttleGlobalThis?: {
            enabled: boolean;
          };
        };
      };
      assert.strictEqual(result.mode, 'safe');
      assert.strictEqual(
        result.embeddedOptions?.scuttleGlobalThis?.enabled,
        false,
        'contentscript must not scuttle the shared content-script world',
      );
    });

    it('uses safe mode for unrecognised chunks', () => {
      const result = runtimeConfig(mockChunk('some-other-chunk')) as {
        mode: string;
      };
      assert.strictEqual(result.mode, 'safe');
    });
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
