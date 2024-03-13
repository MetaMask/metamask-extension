const { strict: assert } = require('assert');
const {
  defaultGanacheOptions,
  withFixtures,
  openDapp,
  unlockWallet,
  WINDOW_TITLES,
} = require('../../helpers');
const { SMART_CONTRACTS } = require('../../seeder/smart-contracts');
const FixtureBuilder = require('../../fixture-builder');

describe('Editing confirmations of dapp initiated contract interactions', function () {
  const smartContract = SMART_CONTRACTS.PIGGYBANK;
  it('should NOT show an edit button on a contract interaction confirmation initiated by a dapp', async function () {
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
      async ({ driver, contractRegistry }) => {
        const contractAddress = await contractRegistry.getContractAddress(
          smartContract,
        );
        await unlockWallet(driver);

        // deploy contract
        await openDapp(driver, contractAddress);
        // wait for deployed contract, calls and confirms a contract method where ETH is sent
        await driver.findClickableElement('#deployButton');
        await driver.clickElement('#depositButton');
        await driver.waitUntilXWindowHandles(3);
        const windowHandles = await driver.getAllWindowHandles();

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.Dialog,
          windowHandles,
        );
        await driver.waitForSelector({
          css: '.confirm-page-container-summary__action__name',
          text: 'Deposit',
        });
        const editTransactionButton = await driver.isElementPresentAndVisible(
          '[data-testid="confirm-page-back-edit-button"]',
        );
        assert.equal(
          editTransactionButton,
          false,
          `Edit transaction button should not be visible on a contract interaction created by a dapp`,
        );
      },
    );
  });

  it('should show an edit button on a simple ETH send initiated by a dapp', async function () {
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
      async ({ driver }) => {
        await unlockWallet(driver);

        await openDapp(driver);
        await driver.clickElement('#sendButton');
        await driver.waitUntilXWindowHandles(3);
        const windowHandles = await driver.getAllWindowHandles();

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.Dialog,
          windowHandles,
        );
        await driver.waitForSelector({
          css: '.confirm-page-container-summary__action__name',
          text: 'Sending ETH',
        });
        const editTransactionButton = await driver.isElementPresentAndVisible(
          '[data-testid="confirm-page-back-edit-button"]',
        );
        assert.equal(
          editTransactionButton,
          true,
          `Edit transaction button should be visible on a contract interaction created by a dapp`,
        );
      },
    );
  });
});
