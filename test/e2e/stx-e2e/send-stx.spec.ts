import {
  withFixtures,
  unlockWallet,
  openActionMenuAndStartSendFlow,
} from '../helpers';
import FixtureBuilder from '../fixture-builder';
import HeaderNavbar from '../page-objects/pages/header-navbar';
import AccountListPage from '../page-objects/pages/account-list-page';
import dotenv from 'dotenv';
import ActivityListPage from '../page-objects/pages/home/activity-list';

dotenv.config();

describe('Send STX', function () {
  it('sends STX to another address', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withPopularNetworks()
          .withNetworkController({
            selectedNetworkClientId: 'bnb-mainnet',
          })
          .build(),
        title: this.test?.fullTitle(),
        localNodeOptions: 'none',
        dapp: false,
        disableMocking: true,
        disablePrivacySnapshotValidation: true,
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // add private key (Account 7 from MMQA)
        const header = new HeaderNavbar(driver);
        await header.check_pageIsLoaded();
        await header.openAccountMenu();

        const accountListPage = new AccountListPage(driver);
        await accountListPage.check_pageIsLoaded();

        await accountListPage.openAccountOptionsMenu();
        await accountListPage.addNewImportedAccount(
          process.env.TEST_STX_PRIVATE_KEY || '',
        );

        // wait to have the balance loaded when send
        await driver.waitForSelector({
          text: `BNB`,
          tag: 'span',
        });

        await openActionMenuAndStartSendFlow(driver);
        await driver.fill(
          'input[placeholder="Enter public address (0x) or domain name"]',
          '0xf91B0678D0E3D593641d25e609784B799B72Fcc8',
        );

        const inputAmount = await driver.findElement('input[placeholder="0"]');

        await inputAmount.fill('0.00001');

        // Continue to next screen
        await driver.clickElement({ text: 'Continue', tag: 'button' });

        // add a check to avoid race condition
        await driver.delay(5000);

        await driver.wait(async () => {
          const nativeCurrencyElement = await driver.findElement(
            '[data-testid="native-currency"]',
          );
          const nativeCurrencyText = await nativeCurrencyElement.getText();
          const nativeCurrencyValue = parseFloat(
            nativeCurrencyText.replace(/[^0-9.-]+/g, ''),
          );
          return nativeCurrencyValue <= 0.01;
        }, 3000);

        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        // await driver.clickElement({ text: 'View Activity', tag: 'button' });
        await driver.delay(2000);
        await driver.clickElement(
          '[data-testid="smart-transaction-status-page-footer-close-button"]',
        );

        await driver.clickElement(
          '[data-testid="account-overview__activity-tab"]',
        );

        const activityListPage = new ActivityListPage(driver);
        await activityListPage.check_txAction('Send');
        await activityListPage.check_txStatusConfirmed();
      },
    );
  });
});
