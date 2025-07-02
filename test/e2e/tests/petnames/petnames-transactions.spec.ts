import { withFixtures, WINDOW_TITLES } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import TestDapp from '../../page-objects/pages/test-dapp';
import Confirmation from '../../page-objects/pages/confirmations/redesign/confirmation';
import HomePage from '../../page-objects/pages/home/homepage';
import SendTokenPage from '../../page-objects/pages/send/send-token-page';
import { Driver } from '../../webdriver/driver';

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
        await confirmation.check_nameIsDisplayed(
          ABBREVIATED_ADDRESS_MOCK,
          false,
        );

        // Test custom name.
        await confirmation.saveName({
          value: ABBREVIATED_ADDRESS_MOCK,
          name: CUSTOM_NAME_MOCK,
        });
        await confirmation.check_pageIsLoaded();
        await confirmation.clickFooterCancelButtonAndAndWaitForWindowToClose();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.clickSimpleSendButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await confirmation.check_nameIsDisplayed(CUSTOM_NAME_MOCK, true);

        // Test proposed name.
        await confirmation.saveName({
          value: CUSTOM_NAME_MOCK,
          proposedName: PROPOSED_NAME_MOCK,
        });
        await confirmation.check_pageIsLoaded();
        await confirmation.clickFooterCancelButtonAndAndWaitForWindowToClose();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.clickSimpleSendButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await confirmation.check_nameIsDisplayed(PROPOSED_NAME_MOCK, true);
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
        await createWalletSendTransaction(ADDRESS_MOCK, driver);
        await confirmation.check_nameIsDisplayed(
          ABBREVIATED_ADDRESS_MOCK,
          false,
        );

        // Test custom name.
        await confirmation.saveName({
          value: ABBREVIATED_ADDRESS_MOCK,
          name: CUSTOM_NAME_MOCK,
        });

        await confirmation.check_pageIsLoaded();
        await confirmation.clickFooterCancelButtonAndWaitToDisappear();
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await createWalletSendTransaction(ADDRESS_MOCK, driver);
        await confirmation.check_nameIsDisplayed(CUSTOM_NAME_MOCK, true);

        // Test proposed name.
        await confirmation.saveName({
          value: CUSTOM_NAME_MOCK,
          proposedName: PROPOSED_NAME_MOCK,
        });
        await confirmation.check_pageIsLoaded();
        await confirmation.clickFooterCancelButtonAndWaitToDisappear();
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await createWalletSendTransaction(ADDRESS_MOCK, driver);
        await confirmation.check_nameIsDisplayed(PROPOSED_NAME_MOCK, true);
      },
    );
  });
});

async function createWalletSendTransaction(
  recipientAddress: string,
  driver: Driver,
): Promise<void> {
  const homePage = new HomePage(driver);
  await homePage.startSendFlow();
  const sendToPage = new SendTokenPage(driver);
  await sendToPage.check_pageIsLoaded();
  await sendToPage.fillRecipient(recipientAddress);
  await sendToPage.goToNextScreen();
}
