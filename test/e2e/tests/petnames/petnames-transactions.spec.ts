import { withFixtures, WINDOW_TITLES } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import TestDapp from '../../page-objects/pages/test-dapp';
import Confirmation from '../../page-objects/pages/confirmations/redesign/confirmation';

const ADDRESS_MOCK = '0x0c54fccd2e384b4bb6f2e405bf5cbc15a017aafb';
const ABBREVIATED_ADDRESS_MOCK = '0x0c54F...7AaFb';
const CUSTOM_NAME_MOCK = 'Custom Name';
const PROPOSED_NAME_MOCK = 'test4.lens';

describe('Petnames - Transactions', function () {
  it('can save petnames for addresses in dapp send transactions', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .withNoNames()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        const testDapp = new TestDapp(driver);
        const confirmation = new Confirmation(driver);
        await loginWithBalanceValidation(driver);
        await testDapp.openTestDappPage();
        await testDapp.clickSimpleSendButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await confirmation.expectName(ABBREVIATED_ADDRESS_MOCK, false);

        // Test custom name.
        await confirmation.saveName(
          ABBREVIATED_ADDRESS_MOCK,
          CUSTOM_NAME_MOCK,
          undefined,
        );
        await confirmation.check_pageIsLoaded();
        await confirmation.clickFooterCancelButtonAndAndWaitForWindowToClose();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.clickSimpleSendButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await confirmation.expectName(CUSTOM_NAME_MOCK, true);

        // Test proposed name.
        await confirmation.saveName(
          CUSTOM_NAME_MOCK,
          undefined,
          PROPOSED_NAME_MOCK,
        );
        await confirmation.check_pageIsLoaded();
        await confirmation.clickFooterCancelButtonAndAndWaitForWindowToClose();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.clickSimpleSendButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await confirmation.expectName(PROPOSED_NAME_MOCK, true);
      },
    );
  });

  it('can save petnames for addresses in wallet send transactions', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withPreferencesController({
            featureFlags: {
              sendHexData: true,
            },
          })
          .withNoNames()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        const confirmation = new Confirmation(driver);
        await loginWithBalanceValidation(driver);
        await confirmation.createWalletSendTransaction(ADDRESS_MOCK);
        await confirmation.expectName(ABBREVIATED_ADDRESS_MOCK, false);

        // Test custom name.
        await confirmation.saveName(
          ABBREVIATED_ADDRESS_MOCK,
          CUSTOM_NAME_MOCK,
          undefined,
        );

        await confirmation.check_pageIsLoaded();
        await confirmation.clickFooterCancelButtonAndAndWaitForWindowToClose();
        await confirmation.createWalletSendTransaction(ADDRESS_MOCK);
        await confirmation.expectName(CUSTOM_NAME_MOCK, true);

        // Test proposed name.
        await confirmation.saveName(
          CUSTOM_NAME_MOCK,
          undefined,
          PROPOSED_NAME_MOCK,
        );
        await confirmation.check_pageIsLoaded();
        await confirmation.clickFooterCancelButtonAndAndWaitForWindowToClose();
        await confirmation.createWalletSendTransaction(ADDRESS_MOCK);
        await confirmation.expectName(PROPOSED_NAME_MOCK, true);
      },
    );
  });
});
