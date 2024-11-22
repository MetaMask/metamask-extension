const { strict: assert } = require('assert');
const {
  withFixtures,
  openDapp,
  unlockWallet,
  WINDOW_TITLES,
  generateGanacheOptions,
  clickNestedButton,
  tempToggleSettingRedesignedTransactionConfirmations,
} = require('../../helpers');
const { SMART_CONTRACTS } = require('../../seeder/smart-contracts');
const FixtureBuilder = require('../../fixture-builder');

describe('Failing contract interaction ', function () {
  const smartContract = SMART_CONTRACTS.FAILING;
  it('should display a warning when the contract interaction is expected to fail', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions: generateGanacheOptions({ hardfork: 'london' }),
        smartContract,
        title: this.test.fullTitle(),
      },
      async ({ driver, contractRegistry }) => {
        const contractAddress = await contractRegistry.getContractAddress(
          smartContract,
        );
        await unlockWallet(driver);

        await tempToggleSettingRedesignedTransactionConfirmations(driver);

        await openDapp(driver, contractAddress);
        let windowHandles = await driver.getAllWindowHandles();
        const extension = windowHandles[0];

        // waits for deployed contract and calls failing contract method
        await driver.findClickableElement('#deployButton');
        await driver.clickElement('#sendFailingButton');
        await driver.waitUntilXWindowHandles(3);
        windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.Dialog,
          windowHandles,
        );

        // display warning when transaction is expected to fail
        const warningText =
          'We were not able to estimate gas. There might be an error in the contract and this transaction may fail.';
        await driver.waitForSelector({
          css: '.mm-banner-alert .mm-text',
          text: warningText,
        });
        const confirmButton = await driver.findElement(
          '[data-testid="page-container-footer-next"]',
        );
        assert.equal(await confirmButton.isEnabled(), false);

        // dismiss warning and confirm the transaction
        await driver.clickElement({
          text: 'I want to proceed anyway',
          tag: 'button',
        });
        await driver.clickElement({ text: 'Confirm', tag: 'button' });
        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindow(extension);
        await clickNestedButton(driver, 'Activity');

        await driver.findElement({
          css: '.activity-list-item .transaction-status-label',
          text: 'Failed',
        });
      },
    );
  });
});

describe('Failing contract interaction on non-EIP1559 network', function () {
  const smartContract = SMART_CONTRACTS.FAILING;
  it('should display a warning when the contract interaction is expected to fail', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions: generateGanacheOptions({ hardfork: 'berlin' }),
        smartContract,
        title: this.test.fullTitle(),
      },
      async ({ driver, contractRegistry }) => {
        const contractAddress = await contractRegistry.getContractAddress(
          smartContract,
        );
        await unlockWallet(driver);

        await tempToggleSettingRedesignedTransactionConfirmations(driver);

        await openDapp(driver, contractAddress);
        let windowHandles = await driver.getAllWindowHandles();
        const extension = windowHandles[0];
        // waits for deployed contract and calls failing contract method
        await driver.findClickableElement('#deployButton');

        await driver.fill('#toInput', contractAddress);
        await driver.fill('#amountInput', '0');
        await driver.fill('#gasInput', '100');

        await driver.clickElement('#submitForm');

        await driver.waitUntilXWindowHandles(3);
        windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.Dialog,
          windowHandles,
        );

        // display warning when transaction is expected to fail
        const warningText =
          'We were not able to estimate gas. There might be an error in the contract and this transaction may fail.';
        await driver.waitForSelector({
          css: '.mm-banner-alert .mm-text',
          text: warningText,
        });
        const confirmButton = await driver.findElement(
          '[data-testid="page-container-footer-next"]',
        );
        assert.equal(await confirmButton.isEnabled(), false);

        // dismiss warning and confirm the transaction
        await driver.clickElement({
          text: 'I want to proceed anyway',
          tag: 'button',
        });
        await driver.clickElement({ text: 'Confirm', tag: 'button' });
        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindow(extension);
        await clickNestedButton(driver, 'Activity');
        await driver.waitForSelector(
          '.transaction-list__completed-transactions .activity-list-item:nth-of-type(1)',
        );

        await driver.findElement({
          css: '.activity-list-item .transaction-status-label',
          text: 'Failed',
        });
      },
    );
  });
});
