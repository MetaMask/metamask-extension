import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import 'ses';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import { getGlobalProperties } from '../../../helpers/protect-intrinsics-helpers';

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

    const intrinsicNames = [...getGlobalProperties()];

    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await login(driver);

        const failures: string[] = await driver.executeScript(function (
          names: string[],
        ) {
          // LavaMoat scuttling replaces protected intrinsics with throwing
          // accessors. The thrown message has a stable shape we recognise
          // and treat as an "expected" outcome rather than a lockdown failure.
          const lavaMoatScuttleRe =
            /LavaMoat - property "[A-Za-z0-9]*" of globalThis is inaccessible under scuttling mode/u;

          const issues: string[] = [];

          for (const propertyName of names) {
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
        }, intrinsicNames);

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
