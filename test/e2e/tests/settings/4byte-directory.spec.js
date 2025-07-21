const FixtureBuilder = require('../../fixture-builder');
const {
  logInWithBalanceValidation,
  openDapp,
  openMenuSafe,
  unlockWallet,
  withFixtures,
  WINDOW_TITLES,
  tempToggleSettingRedesignedTransactionConfirmations,
} = require('../../helpers');
const { SMART_CONTRACTS } = require('../../seeder/smart-contracts');

describe('4byte setting', function () {
  it('makes a call to 4byte when the setting is on', async function () {
    const smartContract = SMART_CONTRACTS.PIGGYBANK;
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        smartContract,
        title: this.test.fullTitle(),
      },
      async ({ driver, contractRegistry }) => {
        const contractAddress = await contractRegistry.getContractAddress(
          smartContract,
        );
        await logInWithBalanceValidation(driver);

        await tempToggleSettingRedesignedTransactionConfirmations(driver);

        // deploy contract
        await openDapp(driver, contractAddress);

        // wait for deployed contract, calls and confirms a contract method where ETH is sent
        await driver.clickElement('#depositButton');

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.waitForSelector({
          tag: 'span',
          text: 'Deposit',
        });
        await driver.assertElementNotPresent({
          tag: 'span',
          text: 'Contract interaction',
        });
      },
    );
  });

  it('does not try to get contract method name from 4byte when the setting is off', async function () {
    const smartContract = SMART_CONTRACTS.PIGGYBANK;
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        smartContract,
        title: this.test.fullTitle(),
      },
      async ({ driver, contractRegistry }) => {
        const contractAddress = await contractRegistry.getContractAddress(
          smartContract,
        );
        await unlockWallet(driver);

        await tempToggleSettingRedesignedTransactionConfirmations(driver);

        // goes to the settings screen
        await openMenuSafe(driver);
        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.clickElement({ text: 'Security & privacy', tag: 'div' });

        // turns off 4Byte Directory contract method name resolution
        await driver.clickElement(
          '[data-testid="4byte-resolution-container"] .toggle-button',
        );

        // deploy contract
        await openDapp(driver, contractAddress);

        // wait for deployed contract, calls and confirms a contract method where ETH is sent
        await driver.clickElement('#depositButton');

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await driver.assertElementNotPresent({
          tag: 'span',
          text: 'Deposit',
        });
        await driver.waitForSelector({
          tag: 'span',
          text: 'Contract interaction',
        });
      },
    );
  });
});
