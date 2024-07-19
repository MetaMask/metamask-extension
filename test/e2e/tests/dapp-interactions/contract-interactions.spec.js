const {
  defaultGanacheOptions,
  withFixtures,
  openDapp,
  unlockWallet,
  largeDelayMs,
  WINDOW_TITLES,
  locateAccountBalanceDOM,
} = require('../../helpers');

const { SMART_CONTRACTS } = require('../../seeder/smart-contracts');
const FixtureBuilder = require('../../fixture-builder');
import HomePage from '../../page-objects/pages/homepage';

describe('Deploy contract and call contract methods', function () {
  const smartContract = SMART_CONTRACTS.PIGGYBANK;

  it('should display the correct account balance after contract interactions', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        smartContract,
        title: this.test.fullTitle(),
      },
      async ({ driver, contractRegistry, ganacheServer }) => {
        const contractAddress = await contractRegistry.getContractAddress(
          smartContract,
        );
        await unlockWallet(driver);

        // deploy contract
        await openDapp(driver, contractAddress);

        // wait for deployed contract, calls and confirms a contract method where ETH is sent
        await driver.delay(largeDelayMs);
        await driver.clickElement('#depositButton');

        await driver.waitForSelector({
          css: 'span',
          text: 'Deposit initiated',
        });

        await driver.waitUntilXWindowHandles(3);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.waitForSelector({
          css: '.confirm-page-container-summary__action__name',
          text: 'Deposit',
        });

        await driver.clickElement({ text: 'Confirm', tag: 'button' });
        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        const homePage = new HomePage(driver);
        await homePage.goToActivityList();
        await homePage.check_confirmedTxNumberDisplayedInActivity();
        await homePage.check_txAmountInActivity('-4 ETH');

        // calls and confirms a contract method where ETH is received
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await driver.clickElement('#withdrawButton');
        await driver.waitUntilXWindowHandles(3);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.clickElement({ text: 'Confirm', tag: 'button' });
        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await homePage.check_confirmedTxNumberDisplayedInActivity(2);
        await homePage.check_txAmountInActivity('-0 ETH');

        // renders the correct ETH balance
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await locateAccountBalanceDOM(driver, ganacheServer);
      },
    );
  });
});
