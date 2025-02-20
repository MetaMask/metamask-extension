const { strict: assert } = require('assert');
const {
  withFixtures,
  openDapp,
  unlockWallet,
  WINDOW_TITLES,
} = require('../../helpers');
import {
  completeCreateNewWalletOnboardingFlow,
  completeImportSRPOnboardingFlow,
  importSRPOnboardingFlow,
} from '../../page-objects/flows/onboarding.flow';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
const FixtureBuilder = require('../../fixture-builder');

describe('Restore vault data', function () {
  it('shows the user a warning if their vault data is missing and then allows them to restore the vault and related data from a backup', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test.fullTitle(),
      },
      async ({ driver, ganacheServer }) => {
        const initH = await driver.getAllWindowHandles();
        await driver.openNewPage('chrome://extensions/');

        await completeImportSRPOnboardingFlow({ driver });
        await driver.navigate('home', { waitForControllers: false });
        await driver.delay(1000);
        await driver.clickElement('#test-abc');
        // await driver.delay(1000);
        await driver.switchToWindow(initH[0]);
        // await driver.openNewURL('chrome://extensions/');
        await driver.delay(1000);
        // await driver.executeScript(
        //   `return document
        //     .querySelector("extensions-manager").shadowRoot
        //     .querySelector("extensions-item-list").shadowRoot
        //     .querySelector('extensions-item')
        //     .shadowRoot.querySelector("#dev-reload-button").click()`
        // );
        await driver.delay(1000);
        await driver.navigate('home', { waitForControllers: false });
        // await driver.delay(100000);
        await driver.clickElement('#critical-error-button');
      },
    );
  });
});