import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import { defaultGanacheOptions, withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import HomePage from '../../page-objects/pages/homepage';
import { loginWithBalanceValidaiton } from '../../page-objects/processes/login.process';

describe('Clear account activity', function (this: Suite) {
  // /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // When user get stuck with pending transactions, one can reset the account by clicking the 'Clear activity tab data' //
  // button in settings, advanced tab. This functionality will clear all the send transactions history.                 //
  // Note that the receive transactions history will be kept and it only affects the current network.                   //
  // /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  it('User can clear account activity via the advanced setting tab', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withTransactionControllerCompletedAndIncomingTransaction()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidaiton(driver);

        // Check send transaction and receive transaction history are all displayed
        const homePage = new HomePage(driver);
        await homePage.goToActivityList();
        await homePage.check_confirmedTxNumberDisplayedInActivity(2);
        await homePage.check_txActionNameInActivity('Receive', 1);
        await homePage.check_txActionNameInActivity('Send', 2);

        // Clear activity and nonce data
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.clickElement({ text: 'Advanced', tag: 'div' });
        await driver.clickElement({
          text: 'Clear activity tab data',
          tag: 'button',
        });
        await driver.clickElement({ text: 'Clear', tag: 'button' });
        await driver.navigate();

        // Check send transaction history is cleared and receive transaction history is kept
        await homePage.check_confirmedTxNumberDisplayedInActivity(1);
        await homePage.check_txActionNameInActivity('Receive', 1);
      },
    );
  });
});
