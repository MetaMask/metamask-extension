import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';

/**
 * End-to-end audit of the SES lockdown applied by
 * `app/scripts/lockdown-{install,run,more}.js`. The lockdown scripts are
 * injected into every extension HTML page by `development/build/scripts.js`,
 * so by the time the unlocked home page is reachable, every named intrinsic
 * on `globalThis` must be non-configurable + non-writable (or, for accessor
 * properties, just non-configurable).
 *
 * Note: we deliberately use a hardcoded list of intrinsic names rather than
 * enumerating `new Compartment().globalThis` like `lockdown-more.js` does.
 * In LavaMoat-scuttled builds (default for test/production), `Compartment`
 * is removed from `globalThis` after init, so dynamic enumeration is
 * impossible from page scope. The list below is a conservative subset of
 * SES's `universalPropertyNames` that has been stable across modern Chrome
 * and Firefox for years — newer intrinsics (Iterator, AsyncDisposableStack,
 * etc.) are intentionally omitted to keep the test browser-agnostic.
 *
 * Browserify-only (for now): the webpack pipeline relies solely on the
 * SES `lockdown()` invocation inlined by `@lavamoat/webpack`. It does NOT
 * load `app/scripts/lockdown-more.js`'s `protectIntrinsics` IIFE, which is
 * what makes the globalThis *slots* (not just the intrinsic values) non-
 * configurable + non-writable. Without that step, every assertion below
 * fails on webpack builds even though SES did freeze the values themselves.
 * We skip the suite when the surrounding GitHub Actions job is a webpack
 * one (matching the `test-suite-name` naming convention in
 * `.github/workflows/e2e-chrome.yml` and `e2e-firefox.yml`). Re-enable on
 * webpack once it ships lockdown-more.js-equivalent slot hardening.
 */
describe('SES lockdown - non-modifiable intrinsics', function (this: Suite) {
  it('freezes named globalThis intrinsics in the extension UI', async function () {
    if (process.env.TEST_SUITE_NAME?.includes('webpack')) {
      console.log(
        'Skipping: webpack builds do not load app/scripts/lockdown-more.js, ' +
          'so globalThis slots are not hardened. Re-enable once webpack ' +
          'matches the browserify hardening pipeline.',
      );
      this.skip();
      return;
    }

    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await login(driver);

        const failures: string[] = await driver.executeScript(function () {
          const intrinsicNames: string[] = [
            // Fundamental constructors
            'Object',
            'Function',
            'Array',
            'String',
            'Number',
            'Boolean',
            'BigInt',
            'Symbol',
            'Date',
            'RegExp',
            // Error constructors
            'Error',
            'EvalError',
            'RangeError',
            'ReferenceError',
            'SyntaxError',
            'TypeError',
            'URIError',
            // Keyed / weak collections
            'Map',
            'Set',
            'WeakMap',
            'WeakSet',
            // Async / metaprogramming
            'Promise',
            'Proxy',
            // Binary data
            'ArrayBuffer',
            'DataView',
            'Int8Array',
            'Uint8Array',
            'Uint8ClampedArray',
            'Int16Array',
            'Uint16Array',
            'Int32Array',
            'Uint32Array',
            'Float32Array',
            'Float64Array',
            // Namespace objects
            'Math',
            'JSON',
            'Reflect',
            // Global functions
            'eval',
            'isFinite',
            'isNaN',
            'parseFloat',
            'parseInt',
            'decodeURI',
            'decodeURIComponent',
            'encodeURI',
            'encodeURIComponent',
            // Primitive value globals
            'NaN',
            'Infinity',
            'undefined',
          ];

          // LavaMoat scuttling replaces protected intrinsics with throwing
          // accessors. The thrown message has a stable shape we recognise
          // and treat as an "expected" outcome rather than a lockdown failure.
          const lavaMoatScuttleRe =
            /LavaMoat - property "[A-Za-z0-9]*" of globalThis is inaccessible under scuttling mode/u;

          const issues: string[] = [];

          for (const propertyName of intrinsicNames) {
            const descriptor = Reflect.getOwnPropertyDescriptor(
              globalThis,
              propertyName,
            );
            if (!descriptor) {
              // Property not present in this browser — skip.
              continue;
            }

            try {
              const value = (globalThis as Record<string, unknown>)[
                propertyName
              ];
              if (value !== globalThis && !Object.isFrozen(value)) {
                issues.push(`${propertyName}: value not frozen`);
              }
            } catch (err) {
              const message = (err as Error)?.message ?? '';
              if (!lavaMoatScuttleRe.test(message)) {
                issues.push(`${propertyName}: ${message}`);
              }
              // LavaMoat-scuttled intrinsics throw on access — expected.
            }

            if ('set' in descriptor || 'get' in descriptor) {
              if (descriptor.configurable !== false) {
                issues.push(`${propertyName}: accessor is configurable`);
              }
            } else {
              if (descriptor.configurable !== false) {
                issues.push(`${propertyName}: data property is configurable`);
              }
              if (descriptor.writable !== false) {
                issues.push(`${propertyName}: data property is writable`);
              }
            }
          }

          return issues;
        });

        assert.deepEqual(
          failures,
          [],
          `Lockdown failed for the following intrinsics:\n  ${failures.join(
            '\n  ',
          )}`,
        );
      },
    );
  });
});
