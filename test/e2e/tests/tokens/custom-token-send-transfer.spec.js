const { strict: assert } = require('assert');
const {
  withFixtures,
  defaultGanacheOptions,
  switchToNotificationWindow,
  openDapp,
  unlockWallet,
  editGasFeeForm,
  WINDOW_TITLES,
  clickNestedButton,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');
const { SMART_CONTRACTS } = require('../../seeder/smart-contracts');

const recipientAddress = '0x2f318C334780961FB129D2a6c30D0763d9a5C970';

describe('Transfer custom tokens @no-mmi', function () {
  const smartContract = SMART_CONTRACTS.HST;
  it('send custom tokens from extension customizing gas values', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().withTokensControllerERC20().build(),
        ganacheOptions: defaultGanacheOptions,
        smartContract,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // go to custom tokens view on extension, perform send tokens
        await driver.clickElement({
          css: '[data-testid="multichain-token-list-item-value"]',
          text: '10 TST',
        });
        await driver.delay(500);
        await driver.clickElement('[data-testid="eth-overview-send"]');
        await driver.fill(
          'input[placeholder="Enter public address (0x) or domain name"]',
          recipientAddress,
        );
        await driver.waitForSelector({
          css: '.ens-input__selected-input__title',
          text: '0x2f318...5C970',
        });
        await driver.fill('input[placeholder="0"]', '1');
        await driver.clickElement({ text: 'Continue', tag: 'button' });

        // check transaction details
        await driver.waitForSelector({
          text: '1 TST',
          tag: 'h1',
        });
        await driver.waitForSelector({
          text: 'Transfer',
          css: '.confirm-page-container-summary__action__name',
        });
        const estimatedGasFee = await driver.findElements(
          '.currency-display-component__text',
        );
        assert.notEqual(
          await estimatedGasFee[1].getText(),
          '0',
          'Estimated gas fee should not be 0',
        );

        // check function name and hex data details in hex tab
        await clickNestedButton(driver, 'Hex');
        await driver.waitForSelector({
          text: 'Transfer',
          tag: 'span',
        });
        await driver.waitForSelector({
          tag: 'p',
          text: '0xa9059cbb0000000000000000000000002f318c334780961fb129d2a6c30d0763d9a5c97',
        });

        // edit gas fee
        await clickNestedButton(driver, 'Details');
        await driver.clickElement({ text: 'Edit', tag: 'button' });
        await editGasFeeForm(driver, '60000', '10');
        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        // check that transaction has completed correctly and is displayed in the activity list
        await driver.waitForSelector({
          css: '[data-testid="activity-list-item-action"]',
          text: 'Send TST',
        });
        await driver.waitForSelector(
          {
            css: '.transaction-list__completed-transactions [data-testid="transaction-list-item-primary-currency"]',
            text: '-1 TST',
          },
          { timeout: 10000 },
        );
      },
    );
  });

  it('transfer custom tokens from dapp customizing gas values', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .withTokensControllerERC20()
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

        // transfer token from dapp
        await openDapp(driver, contractAddress);
        await driver.clickElement({ text: 'Transfer Tokens', tag: 'button' });
        await switchToNotificationWindow(driver);
        await driver.waitForSelector({ text: '1.5 TST', tag: 'h1' });

        // edit gas fee
        await driver.clickElement({ text: 'Edit', tag: 'button' });
        await editGasFeeForm(driver, '60000', '10');
        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        // in extension, check that transaction has completed correctly and is displayed in the activity list
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await clickNestedButton(driver, 'Activity');
        await driver.waitForSelector({
          css: '[data-testid="transaction-list-item-primary-currency"]',
          text: '-1.5 TST',
        });

        // this selector helps prevent flakiness. it allows driver to wait until send transfer is "confirmed"
        await driver.waitForSelector({
          text: 'Confirmed',
          tag: 'div',
        });

        // check token amount is correct after transaction
        await clickNestedButton(driver, 'Tokens');
        const tokenAmount = await driver.findElement(
          {
            css: '[data-testid="multichain-token-list-item-value"]',
            text: '8.5 TST',
          },
          { timeout: 10000 },
        );
        assert.ok(tokenAmount, 'Token amount is not correct');
      },
    );
  });

  it('transfer custom tokens from dapp without specifying gas', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .withTokensControllerERC20()
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

        // transfer token from dapp
        await openDapp(driver, contractAddress);
        await driver.clickElement({
          text: 'Transfer Tokens Without Gas',
          tag: 'button',
        });
        await switchToNotificationWindow(driver);
        await driver.waitForSelector({ text: '1.5 TST', tag: 'h1' });
        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        // in extension, check that transaction has completed correctly and is displayed in the activity list
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await clickNestedButton(driver, 'Activity');
        await driver.waitForSelector({
          css: '[data-testid="transaction-list-item-primary-currency"]',
          text: '-1.5 TST',
        });
        await driver.waitForSelector({
          css: '[data-testid="activity-list-item-action"]',
          text: 'Send TST',
        });

        // this selector helps prevent flakiness. it allows driver to wait until send transfer is "confirmed"
        await driver.waitForSelector({
          text: 'Confirmed',
          tag: 'div',
        });

        // check token amount is correct after transaction
        await clickNestedButton(driver, 'Tokens');
        const tokenAmount = await driver.findElement(
          {
            css: '[data-testid="multichain-token-list-item-value"]',
            text: '8.5 TST',
          },
          { timeout: 10000 },
        );
        assert.ok(tokenAmount, 'Token amount is not correct');
      },
    );
  });
});
