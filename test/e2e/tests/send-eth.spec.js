const { strict: assert } = require('assert');
const { SMART_CONTRACTS } = require('../seeder/smart-contracts');
const {
  convertToHexValue,
  withFixtures,
  openDapp,
  locateAccountBalanceDOM,
  logInWithBalanceValidation,
  openActionMenuAndStartSendFlow,
  unlockWallet,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('Send ETH from inside MetaMask using default gas', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };
  it('finds the transaction in the transactions list', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver, ganacheServer }) => {
        await logInWithBalanceValidation(driver, ganacheServer);

        await openActionMenuAndStartSendFlow(driver);
        if (process.env.MULTICHAIN) {
          return;
        }
        await driver.fill(
          'input[placeholder="Enter public address (0x) or ENS name"]',
          '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
        );

        const inputAmount = await driver.findElement('.unit-input__input');
        await inputAmount.fill('1000');

        await driver.findElement({
          css: '.send-v2__error-amount',
          text: 'Insufficient funds for gas',
        });

        await inputAmount.press(driver.Key.BACK_SPACE);
        await inputAmount.press(driver.Key.BACK_SPACE);
        await inputAmount.press(driver.Key.BACK_SPACE);

        await driver.assertElementNotPresent('.send-v2__error-amount');

        const amountMax = await driver.findClickableElement(
          '.send-v2__amount-max',
        );
        await amountMax.click();

        let inputValue = await inputAmount.getProperty('value');

        assert(Number(inputValue) > 24);

        await amountMax.click();

        assert.equal(await inputAmount.isEnabled(), true);

        await inputAmount.fill('1');

        inputValue = await inputAmount.getProperty('value');
        assert.equal(inputValue, '1');

        // Continue to next screen
        await driver.clickElement({ text: 'Next', tag: 'button' });

        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        await driver.clickElement('[data-testid="home__activity-tab"]');
        await driver.wait(async () => {
          const confirmedTxes = await driver.findElements(
            '.transaction-list__completed-transactions .activity-list-item',
          );
          return confirmedTxes.length === 1;
        }, 10000);

        await driver.waitForSelector({
          css: '[data-testid="transaction-list-item-primary-currency"]',
          text: '-1 ETH',
        });
      },
    );
  });
});

describe('Send ETH non-contract address with data that matches ERC20 transfer data signature', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };
  it('renders the correct recipient on the confirmation screen', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withPreferencesController({
            featureFlags: {
              sendHexData: true,
            },
          })
          .build(),
        ganacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver, ganacheServer }) => {
        await logInWithBalanceValidation(driver, ganacheServer);

        await openActionMenuAndStartSendFlow(driver);
        if (process.env.MULTICHAIN) {
          return;
        }
        await driver.fill(
          'input[placeholder="Enter public address (0x) or ENS name"]',
          '0xc427D562164062a23a5cFf596A4a3208e72Acd28',
        );

        await driver.fill(
          'textarea[placeholder="Optional',
          '0xa9059cbb0000000000000000000000002f318C334780961FB129D2a6c30D0763d9a5C970000000000000000000000000000000000000000000000000000000000000000a',
        );

        await driver.findClickableElement({ text: 'Next', tag: 'button' });
        await driver.clickElement({ text: 'Next', tag: 'button' });

        await driver.findClickableElement(
          '[data-testid="sender-to-recipient__name"]',
        );
        await driver.clickElement('[data-testid="sender-to-recipient__name"]');

        const recipientAddress = await driver.findElements({
          text: '0xc427D562164062a23a5cFf596A4a3208e72Acd28',
        });

        assert.equal(recipientAddress.length, 1);
      },
    );
  });
});

/* eslint-disable-next-line mocha/max-top-level-suites */
describe('Send ETH from inside MetaMask using advanced gas modal', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };
  it('finds the transaction in the transactions list', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await driver.delay(1000);

        await openActionMenuAndStartSendFlow(driver);
        if (process.env.MULTICHAIN) {
          return;
        }
        await driver.fill(
          'input[placeholder="Enter public address (0x) or ENS name"]',
          '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
        );

        const inputAmount = await driver.findElement('.unit-input__input');
        await inputAmount.fill('1');

        const inputValue = await inputAmount.getProperty('value');
        assert.equal(inputValue, '1');

        // Continue to next screen
        await driver.clickElement({ text: 'Next', tag: 'button' });

        await driver.delay(1000);
        const transactionAmounts = await driver.findElements(
          '.currency-display-component__text',
        );
        const transactionAmount = transactionAmounts[0];
        assert.equal(await transactionAmount.getText(), '1');

        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        await driver.wait(async () => {
          const confirmedTxes = await driver.findElements(
            '.transaction-list__completed-transactions .activity-list-item',
          );
          return confirmedTxes.length === 1;
        }, 10000);

        await driver.waitForSelector({
          css: '[data-testid="transaction-list-item-primary-currency"]',
          text: '-1 ETH',
        });
      },
    );
  });
});

describe('Send ETH from dapp using advanced gas controls', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };

  it('should display the correct gas price on the legacy transaction', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // initiates a send from the dapp
        await openDapp(driver);
        await driver.clickElement({ text: 'Send', tag: 'button' });
        await driver.waitUntilXWindowHandles(3);
        const windowHandles = await driver.getAllWindowHandles();
        const extension = windowHandles[0];
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        await driver.assertElementNotPresent({ text: 'Data', tag: 'li' });
        await driver.clickElement({ text: 'Edit', tag: 'button' });
        await driver.waitForSelector({
          text: '0.00021 ETH',
        });
        await driver.clickElement({
          text: 'Edit suggested gas fee',
          tag: 'button',
        });
        await driver.waitForSelector({
          text: '0.00021 ETH',
        });
        const inputs = await driver.findElements('input[type="number"]');
        const gasPriceInput = inputs[1];
        await gasPriceInput.fill('100');
        await driver.waitForSelector({
          text: '0.0021 ETH',
        });
        await driver.clickElement({ text: 'Save', tag: 'button' });
        await driver.waitForSelector({
          css: '.transaction-detail-item:nth-of-type(1) h6:nth-of-type(2)',
          text: '0.0021 ETH',
        });
        await driver.clickElement({ text: 'Confirm', tag: 'button' });
        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindow(extension);

        // finds the transaction in the transactions list
        await driver.clickElement('[data-testid="home__activity-tab"]');
        await driver.waitForSelector(
          '.transaction-list__completed-transactions .activity-list-item:nth-of-type(1)',
        );
        await driver.waitForSelector({
          css: '[data-testid="transaction-list-item-primary-currency"]',
          text: '-0 ETH',
        });

        // the transaction has the expected gas price
        driver.clickElement(
          '[data-testid="transaction-list-item-primary-currency"]',
        );
        await driver.waitForSelector({
          css: '[data-testid="transaction-breakdown__gas-price"]',
          text: '100',
        });
      },
    );
  });

  it('should display correct gas values for EIP-1559 transaction', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions: {
          ...ganacheOptions,
          hardfork: 'london',
        },
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // initiates a transaction from the dapp
        await openDapp(driver);
        await driver.clickElement({ text: 'Create Token', tag: 'button' });
        const windowHandles = await driver.waitUntilXWindowHandles(3);

        const extension = windowHandles[0];
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        await driver.assertElementNotPresent({ text: 'Data', tag: 'li' });
        await driver.clickElement('[data-testid="edit-gas-fee-button"]');
        await driver.clickElement('[data-testid="edit-gas-fee-item-custom"]');

        const baseFeeInput = await driver.findElement(
          '[data-testid="base-fee-input"]',
        );
        await baseFeeInput.fill('25');
        const priorityFeeInput = await driver.findElement(
          '[data-testid="priority-fee-input"]',
        );
        await priorityFeeInput.fill('1');

        await driver.clickElement({ text: 'Save', tag: 'button' });
        await driver.waitForSelector({
          css: '.transaction-detail-item:nth-of-type(1) h6:nth-of-type(2)',
          text: '0.04503836 ETH',
        });
        await driver.waitForSelector({
          css: '.transaction-detail-item:nth-of-type(2) h6:nth-of-type(2)',
          text: '0.04503836 ETH',
        });

        await driver.clickElement({ text: 'Confirm', tag: 'button' });
        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindow(extension);

        // Identify the transaction in the transactions list
        await driver.waitForSelector(
          process.env.MULTICHAIN
            ? '[data-testid="token-balance-overview-currency-display"]'
            : '[data-testid="eth-overview__primary-currency"]',
        );

        await driver.clickElement('[data-testid="home__activity-tab"]');
        await driver.waitForSelector(
          '.transaction-list__completed-transactions .activity-list-item:nth-of-type(1)',
        );
        await driver.waitForSelector({
          css: '[data-testid="transaction-list-item-primary-currency"]',
          text: '-0 ETH',
        });

        // the transaction has the expected gas value
        await driver.clickElement(
          '[data-testid="transaction-list-item-primary-currency"]',
        );

        await driver.waitForSelector({
          text: '0.000000025',
        });
      },
    );
  });
});

describe('Send ETH from inside MetaMask to a Multisig Address', function () {
  const smartContract = SMART_CONTRACTS.MULTISIG;
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };

  it('finds the transaction in the transactions list', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions,
        smartContract,
        title: this.test.fullTitle(),
      },
      async ({ driver, contractRegistry, ganacheServer }) => {
        const contractAddress = await contractRegistry.getContractAddress(
          smartContract,
        );
        await logInWithBalanceValidation(driver, ganacheServer);

        await openActionMenuAndStartSendFlow(driver);
        if (process.env.MULTICHAIN) {
          return;
        }
        await driver.fill(
          'input[placeholder="Enter public address (0x) or ENS name"]',
          contractAddress,
        );

        const inputAmount = await driver.findElement('.unit-input__input');
        await inputAmount.fill('1');

        // Continue to next screen
        await driver.clickElement({ text: 'Next', tag: 'button' });
        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        // Go back to home screen to check txn
        await locateAccountBalanceDOM(driver, ganacheServer);
        await driver.clickElement('[data-testid="home__activity-tab"]');

        await driver.findElement(
          '.transaction-list__completed-transactions .activity-list-item',
        );
        await driver.assertElementNotPresent(
          '.transaction-status-label--failed',
        );
      },
    );
  });
});
