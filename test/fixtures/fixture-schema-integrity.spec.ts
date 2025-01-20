import assert from 'assert';
import { readdirSync } from 'fs';
import { join } from 'path';
import { Driver } from '../e2e/webdriver/driver';
import { withFixtures, WALLET_PASSWORD } from '../e2e/helpers';
import { importSRPOnboardingFlow } from '../e2e/page-objects/flows/onboarding.flow';
import {
  E2E_SRP,
  FIXTURE_STATE_METADATA_VERSION,
} from '../e2e/default-fixture';
import { isFixturesStateSchemaValid } from './validate-schema';

describe('Fixture Schema Integrity', function () {
  let driver: Driver;

  it('should have matching schema with current wallet state', async function () {
    await withFixtures(
      {
        disableServerMochaToBackground: true,
      },
      async ({ driver: testDriver }) => {
        driver = testDriver;
        await driver.waitUntilXWindowHandles(2);
        const windowHandles = await driver.driver.getAllWindowHandles();
        await driver.driver.switchTo().window(windowHandles[2]);

        await importSRPOnboardingFlow({
          driver,
          password: WALLET_PASSWORD,
          seedPhrase: E2E_SRP,
        });

        const state = await driver.executeScript(`
          return await window.stateHooks.getPersistedState();
        `);

        const isValid = isFixturesStateSchemaValid(state);
        assert.equal(isValid, true);
      },
    );
  });

  it('should have up-to-date migration version', function () {
    const migrationsPath = join(__dirname, '../../app/scripts/migrations');
    const migrationFiles = readdirSync(migrationsPath)
      .filter((file) => /^\d+$/u.test(file))
      .map(Number)
      .sort((a, b) => b - a);

    const latestMigration = migrationFiles[0];

    if (latestMigration > FIXTURE_STATE_METADATA_VERSION) {
      throw new Error(
        `Fixture state version (${FIXTURE_STATE_METADATA_VERSION}) is behind the latest migration (${latestMigration}). Please update the fixture state version.`,
      );
    }
  });

  afterEach(async function () {
    if (driver) {
      await driver.quit();
    }
  });
});
