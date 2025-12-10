const { strict: assert } = require('assert');
const { SMART_CONTRACTS } = require('../../seeder/smart-contracts');
const {
  loginWithBalanceValidation,
} = require('../../page-objects/flows/login.flow');
const { withFixtures, WINDOW_TITLES, DAPP_URL } = require('../../helpers');
const FixtureBuilder = require('../../fixtures/fixture-builder');
const { mockSpotPrices } = require('../tokens/utils/mocks');

const PREFERENCES_STATE_MOCK = {
  preferences: {
    showFiatInTestnets: true,
  },
  // Enables advanced details due to migration 123
  useNonceField: true,
};

describe('Send ETH', function () {
  describe('from inside MetaMask', function () {
    it('finds the transaction in the transactions list using default gas', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder().build(),
          title: this.test.fullTitle(),
        },
        async ({ driver }) => {
          await loginWithBalanceValidation(driver);

          await driver.clickElement('[data-testid="eth-overview-send"]');

          await driver.fill(
            'input[placeholder="Enter public address (0x) or domain name"]',
            '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
          );

          const inputAmount = await driver.findElement(
            'input[placeholder="0"]',
          );

          await inputAmount.press('1');
          await inputAmount.press('0');
          await inputAmount.press('0');
          await inputAmount.press('0');

          await driver.findElement({
            css: '[data-testid="send-page-amount-error"]',
            text: '. Insufficient funds.',
          });

          await inputAmount.press(driver.Key.BACK_SPACE);
          await inputAmount.press(driver.Key.BACK_SPACE);
          await inputAmount.press(driver.Key.BACK_SPACE);

          await driver.clickElement('[data-testid="max-clear-button"]');

          let inputValue = await inputAmount.getProperty('value');

          assert(Number(inputValue) > 24);

          await driver.clickElement('[data-testid="max-clear-button"]');

          assert.equal(await inputAmount.isEnabled(), true);

          await inputAmount.fill('1');

          inputValue = await inputAmount.getProperty('value');
          assert.equal(inputValue, '1');

          // Continue to next screen
          await driver.clickElement({ text: 'Continue', tag: 'button' });

          await driver.clickElement({ text: 'Confirm', tag: 'button' });

          await driver.clickElement(
            '[data-testid="account-overview__activity-tab"]',
          );
          await driver.wait(async () => {
            const confirmedTxes = await driver.findElements(
              '.transaction-status-label--confirmed',
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

    /* eslint-disable-next-line mocha/max-top-level-suites */
    it('finds the transaction in the transactions list using advanced gas modal', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder().build(),
          title: this.test.fullTitle(),
        },
        async ({ driver }) => {
          await loginWithBalanceValidation(driver);

          await driver.clickElement('[data-testid="eth-overview-send"]');
          await driver.fill(
            'input[placeholder="Enter public address (0x) or domain name"]',
            '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
          );

          const inputAmount = await driver.findElement(
            'input[placeholder="0"]',
          );
          await inputAmount.press('1');

          const inputValue = await inputAmount.getProperty('value');
          assert.equal(inputValue, '1');

          // Continue to next screen
          await driver.clickElement({ text: 'Continue', tag: 'button' });

          // Transaction Amount
          await driver.findElement({
            css: 'h2',
            text: '1 ETH',
          });

          await driver.clickElement({ text: 'Confirm', tag: 'button' });

          await driver.wait(async () => {
            const confirmedTxes = await driver.findElements(
              '.transaction-status-label--confirmed',
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

    it('finds the transaction in the transactions list when sending to a Multisig Address', async function () {
      const smartContract = SMART_CONTRACTS.MULTISIG;
      await withFixtures(
        {
          fixtures: new FixtureBuilder().build(),
          smartContract,
          title: this.test.fullTitle(),
        },
        async ({ driver, contractRegistry, localNodes }) => {
          const contractAddress =
            await contractRegistry.getContractAddress(smartContract);
          await loginWithBalanceValidation(driver, localNodes[0]);

          await driver.clickElement('[data-testid="eth-overview-send"]');
          await driver.fill(
            'input[placeholder="Enter public address (0x) or domain name"]',
            contractAddress,
          );

          const inputAmount = await driver.findElement(
            'input[placeholder="0"]',
          );
          await inputAmount.sendKeys('1');

          // Continue to next screen
          await driver.clickElement({ text: 'Continue', tag: 'button' });
          await driver.clickElement({ text: 'Confirm', tag: 'button' });

          // Go back to home screen to check txn
          const balance = await driver.findElement(
            '[data-testid="eth-overview__primary-currency"]',
          );

          assert.ok(/^[\d.]+\sETH$/u.test(await balance.getText()));

          await driver.clickElement(
            '[data-testid="account-overview__activity-tab"]',
          );

          await driver.findElement('.transaction-status-label--confirmed');

          // The previous findElement already serves as the guard here for the assertElementNotPresent
          await driver.assertElementNotPresent(
            '.transaction-status-label--failed',
          );
        },
      );
    });

    it('shows no error when cancel transaction when sending via QR code', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder().build(),
          title: this.test.fullTitle(),
        },
        async ({ driver }) => {
          await loginWithBalanceValidation(driver);

          await driver.clickElement('[data-testid="eth-overview-send"]');
          // choose to scan via QR code
          await driver.clickElement('[data-testid="ens-qr-scan-button"]');
          await driver.findVisibleElement('[data-testid="qr-scanner-modal"]');
          // cancel action will close the dialog and shut down camera initialization
          await driver.waitForSelector({
            css: '.qr-scanner__error',
            text: "We couldn't access your camera. Please give it another try.",
          });
          await driver.clickElementAndWaitToDisappear({
            text: 'Cancel',
            tag: 'button',
          });
          await driver.assertElementNotPresent(
            '[data-testid="qr-scanner-modal"]',
          );
        },
      );
    });

    describe('from dapp using advanced gas controls', function () {
      it('should display the correct gas price on the legacy transaction', async function () {
        await withFixtures(
          {
            dappOptions: { numberOfTestDapps: 1 },
            fixtures: new FixtureBuilder()
              .withPermissionControllerConnectedToTestDapp()
              .withPreferencesController(PREFERENCES_STATE_MOCK)
              .build(),
            title: this.test.fullTitle(),
            localNodeOptions: {
              hardfork: 'muirGlacier',
            },
            testSpecificMock: async (mockServer) => {
              await mockSpotPrices(mockServer, {
                'eip155:1/slip44:60': {
                  price: 1700,
                  marketCap: 382623505141,
                  pricePercentChange1d: 0,
                },
              });
            },
          },
          async ({ driver }) => {
            await loginWithBalanceValidation(driver);

            // initiates a send from the dapp
            await driver.openNewPage(DAPP_URL);
            await driver.clickElement({ text: 'Send', tag: 'button' });
            await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

            await driver.clickElement('[data-testid="edit-gas-fee-icon"]');
            await driver.waitForSelector({
              text: '0.000042 ETH',
            });
            await driver.clickElement({
              text: 'Edit suggested gas fee',
              tag: 'button',
            });
            await driver.waitForSelector({
              text: 'Edit priority',
              tag: 'header',
            });

            // Edit priority gas fee form
            const inputs = await driver.findElements('input[type="number"]');
            const gasLimitInput = inputs[0];
            const gasPriceInput = inputs[1];
            await gasLimitInput.fill('21000');
            await gasPriceInput.fill('100');
            await driver.clickElement({ text: 'Save', tag: 'button' });
            await driver.findElement({
              css: '[data-testid="first-gas-field"]',
              text: '0.0021',
            });

            await driver.findElement({
              css: '[data-testid="native-currency"]',
              text: '$3.57',
            });

            await driver.clickElementAndWaitForWindowToClose({
              text: 'Confirm',
              tag: 'button',
            });
            await driver.switchToWindowWithTitle(
              WINDOW_TITLES.ExtensionInFullScreenView,
            );

            // finds the transaction in the transactions list
            await driver.clickElement(
              '[data-testid="account-overview__activity-tab"]',
            );
            await driver.waitForSelector(
              '.transaction-status-label--confirmed',
            );
            await driver.waitForSelector({
              css: '[data-testid="transaction-list-item-primary-currency"]',
              text: '-0 ETH',
            });

            // the transaction has the expected gas price
            await driver.clickElement(
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
            dappOptions: { numberOfTestDapps: 1 },
            fixtures: new FixtureBuilder()
              .withPermissionControllerConnectedToTestDapp()
              .withPreferencesController(PREFERENCES_STATE_MOCK)
              .build(),
            title: this.test.fullTitle(),
            testSpecificMock: async (mockServer) => {
              await mockSpotPrices(mockServer, {
                'eip155:1/slip44:60': {
                  price: 1700,
                  marketCap: 382623505141,
                  pricePercentChange1d: 0,
                },
              });
            },
          },
          async ({ driver }) => {
            await loginWithBalanceValidation(driver);

            // initiates a transaction from the dapp
            await driver.openNewPage(DAPP_URL);
            await driver.clickElement({
              text: 'Create Token',
              tag: 'button',
            });

            await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

            await driver.clickElement('[data-testid="edit-gas-fee-icon"]');
            await driver.clickElement(
              '[data-testid="edit-gas-fee-item-custom"]',
            );

            const baseFeeInput = await driver.findElement(
              '[data-testid="base-fee-input"]',
            );
            await baseFeeInput.fill('25');
            const priorityFeeInput = await driver.findElement(
              '[data-testid="priority-fee-input"]',
            );
            await priorityFeeInput.fill('1');

            await driver.clickElement({ text: 'Save', tag: 'button' });

            await driver.findElement({
              css: '[data-testid="first-gas-field"]',
              text: '0.045',
            });

            await driver.findElement({
              css: '[data-testid="native-currency"]',
              text: '$76.59',
            });

            await driver.clickElementAndWaitForWindowToClose({
              text: 'Confirm',
              tag: 'button',
            });
            await driver.switchToWindowWithTitle(
              WINDOW_TITLES.ExtensionInFullScreenView,
            );

            // Identify the transaction in the transactions list
            await driver.waitForSelector(
              '[data-testid="eth-overview__primary-currency"]',
            );

            await driver.clickElement(
              '[data-testid="account-overview__activity-tab"]',
            );
            await driver.waitForSelector(
              '.transaction-status-label--confirmed',
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
              xpath: "//div[contains(text(), 'Base fee')]",
            });

            const allFeeValues = await driver.findElements(
              '.currency-display-component__text',
            );

            /**
             * Below lines check that fee values are numeric.
             * Because these values change for every e2e run,
             * It's better to just check that the values are there and are numeric
             */
            assert.equal(allFeeValues.length > 0, true);

            allFeeValues.forEach(async (feeValue) => {
              assert.equal(/\d+\.?\d*/u.test(await feeValue.getText()), true);
            });
          },
        );
      });
    });

    describe('to non-contract address with data that matches ERC20 transfer data signature', function () {
      it('renders the correct recipient on the confirmation screen', async function () {
        await withFixtures(
          {
            fixtures: new FixtureBuilder()
              .withPreferencesController({
                featureFlags: {
                  sendHexData: true,
                },
              })
              .withPreferencesControllerPetnamesDisabled()
              .build(),
            title: this.test.fullTitle(),
          },
          async ({ driver }) => {
            await loginWithBalanceValidation(driver);

            await driver.clickElement('[data-testid="eth-overview-send"]');

            await driver.fill(
              'input[placeholder="Enter public address (0x) or domain name"]',
              '0xc427D562164062a23a5cFf596A4a3208e72Acd28',
            );

            await driver.fill(
              'textarea[placeholder="Optional',
              '0xa9059cbb0000000000000000000000002f318C334780961FB129D2a6c30D0763d9a5C970000000000000000000000000000000000000000000000000000000000000000a',
            );

            await driver.findClickableElement({
              text: 'Continue',
              tag: 'button',
            });
            await driver.clickElement({ text: 'Continue', tag: 'button' });

            const recipientAddress = await driver.findElements({
              text: '0xc427D...Acd28',
            });

            assert.equal(recipientAddress.length, 2);
          },
        );
      });
    });
  });
});
