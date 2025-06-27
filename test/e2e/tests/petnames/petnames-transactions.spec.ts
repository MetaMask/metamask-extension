import { withFixtures, WINDOW_TITLES } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import TestDapp from '../../page-objects/pages/test-dapp';
import Petnames from './petnames-helpers';

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
        title: this.test?.fullTitle() ?? 'Default Title',
      },
      async ({ driver }) => {
        const testDapp = new TestDapp(driver);
        const petnames = new Petnames(driver);
        await loginWithBalanceValidation(driver);
        await testDapp.openTestDappPage();
        await testDapp.clickSimpleSendButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await petnames.expectName(ABBREVIATED_ADDRESS_MOCK, false);

        // Test custom name.
        await petnames.saveName(
          ABBREVIATED_ADDRESS_MOCK,
          CUSTOM_NAME_MOCK,
          undefined,
        );
        await driver.clickElementAndWaitForWindowToClose({
          tag: 'button',
          text: 'Cancel',
        });
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.clickSimpleSendButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await petnames.expectName(CUSTOM_NAME_MOCK, true);

        // Test proposed name.
        await petnames.saveName(
          CUSTOM_NAME_MOCK,
          undefined,
          PROPOSED_NAME_MOCK,
        );
        await driver.clickElement({ tag: 'button', text: 'Cancel' });
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.clickSimpleSendButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await petnames.expectName(PROPOSED_NAME_MOCK, true);
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
        title: this.test?.fullTitle() ?? 'Default Title',
      },
      async ({ driver }) => {
        const petnames = new Petnames(driver);
        await loginWithBalanceValidation(driver);
        await petnames.createWalletSendTransaction(ADDRESS_MOCK);
        await petnames.expectName(ABBREVIATED_ADDRESS_MOCK, false);

        // Test custom name.
        await petnames.saveName(
          ABBREVIATED_ADDRESS_MOCK,
          CUSTOM_NAME_MOCK,
          undefined,
        );
        await driver.clickElement({ tag: 'button', text: 'Cancel' });
        await petnames.createWalletSendTransaction(ADDRESS_MOCK);
        await petnames.expectName(CUSTOM_NAME_MOCK, true);

        // Test proposed name.
        await petnames.saveName(
          CUSTOM_NAME_MOCK,
          undefined,
          PROPOSED_NAME_MOCK,
        );
        await driver.clickElement({ tag: 'button', text: 'Cancel' });
        await petnames.createWalletSendTransaction(ADDRESS_MOCK);
        await petnames.expectName(PROPOSED_NAME_MOCK, true);
      },
    );
  });
});
