import { Driver } from '../e2e/webdriver/driver';
import { withFixtures, WALLET_PASSWORD } from '../e2e/helpers';
import { importSRPOnboardingFlow } from '../e2e/page-objects/flows/onboarding.flow';
import { E2E_SRP } from '../e2e/default-fixture';
import { validateStateSchema } from './validate-schema';

describe('Fixture Schema Integrity', function () {
  let driver: Driver;

  before(async function () {
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

        validateStateSchema(state);
      },
    );
  });

  after(async function () {
    if (driver) {
      await driver.quit();
    }
  });
});
