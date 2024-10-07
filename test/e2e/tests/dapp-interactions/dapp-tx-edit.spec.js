const {
  defaultGanacheOptions,
  logInWithBalanceValidation,
  openDapp,
  WINDOW_TITLES,
  withFixtures,
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
        await logInWithBalanceValidation(driver);

        // deploy contract
        await openDapp(driver, contractAddress);
        // wait for deployed contract, calls and confirms a contract method where ETH is sent
        await driver.findClickableElement('#deployButton');
        await driver.clickElement('#depositButton');

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.waitForSelector({
          css: '.confirm-page-container-summary__action__name',
          text: 'Deposit',
        });
        await driver.waitForSelector({
          css: '[data-testid="confirm-page-back-edit-button"]',
          text: 'Edit transaction button should not be visible on a contract interaction created by a dapp',
        });
      },
    );
  });

  it('should NOT show an edit button on a simple ETH send initiated by a dapp', async function () {
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
        await logInWithBalanceValidation(driver);

        await openDapp(driver);
        await driver.clickElement('#sendButton');

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.waitForSelector({
          css: '.confirm-page-container-summary__action__name',
          text: 'Sending ETH',
        });
        await driver.waitForSelector({
          css: '[data-testid="confirm-page-back-edit-button"]',
          text: 'Edit transaction button should not be visible on a simple send transaction created by a dapp',
        });
      },
    );
  });
});
