const {
  mockedSourcifyTokenSend,
} = require('../confirmations/transactions/erc20-token-send-redesign.spec');
const {
  withFixtures,
  defaultGanacheOptions,
  switchToNotificationWindow,
  openDapp,
  unlockWallet,
  editGasFeeForm,
  WINDOW_TITLES,
  clickNestedButton,
  veryLargeDelayMs,
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
        testSpecificMock: mocks,
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
          tag: 'h2',
        });

        // edit gas fee
        await driver.clickElement('[data-testid="edit-gas-fee-icon"]');
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
        testSpecificMock: mocks,
      },
      async ({ driver, contractRegistry }) => {
        const contractAddress = await contractRegistry.getContractAddress(
          smartContract,
        );
        await unlockWallet(driver);

        // transfer token from dapp
        await openDapp(driver, contractAddress);
        await driver.delay(veryLargeDelayMs);

        await driver.clickElement({ text: 'Transfer Tokens', tag: 'button' });

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.waitForSelector({ text: '1.5 TST', tag: 'h2' });

        // edit gas fee
        await driver.clickElement('[data-testid="edit-gas-fee-icon"]');
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
        await driver.waitForSelector({
          css: '[data-testid="multichain-token-list-item-value"]',
          text: '8.5 TST',
        });
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
        testSpecificMock: mocks,
      },
      async ({ driver, contractRegistry }) => {
        const contractAddress = await contractRegistry.getContractAddress(
          smartContract,
        );
        await unlockWallet(driver);

        // transfer token from dapp
        await openDapp(driver, contractAddress);
        await driver.delay(veryLargeDelayMs);
        await driver.clickElement({
          text: 'Transfer Tokens Without Gas',
          tag: 'button',
        });
        await switchToNotificationWindow(driver);
        await driver.waitForSelector({ text: '1.5 TST', tag: 'h2' });
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
        await driver.waitForSelector({
          css: '[data-testid="multichain-token-list-item-value"]',
          text: '8.5 TST',
        });
      },
    );
  });

  async function mocks(server) {
    return [await mockedSourcifyTokenSend(server)];
  }
});
