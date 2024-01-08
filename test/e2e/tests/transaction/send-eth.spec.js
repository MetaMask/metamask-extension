const { strict: assert } = require('assert');
const { SMART_CONTRACTS } = require('../../seeder/smart-contracts');
const {
  withFixtures,
  openDapp,
  logInWithBalanceValidation,
  openActionMenuAndStartSendFlow,
  unlockWallet,
  editGasfeeForm,
  WINDOW_TITLES,
  defaultGanacheOptions,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

describe('Send ETH', function () {
  describe('from inside MetaMask', function () {
    it('finds the transaction in the transactions list using default gas', async function () {
      if (process.env.MULTICHAIN) {
        return;
      }
      await withFixtures(
        {
          fixtures: new FixtureBuilder().build(),
          ganacheOptions: defaultGanacheOptions,
          title: this.test.fullTitle(),
        },
        async ({ driver, ganacheServer }) => {
          await logInWithBalanceValidation(driver, ganacheServer);

          await openActionMenuAndStartSendFlow(driver);

          await driver.fill(
            'input[placeholder="Enter public address (0x) or ENS name"]',
            '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
          );

          const inputAmount = await driver.findElement(
            'input[placeholder="0"]',
          );
          await inputAmount.fill('1000');

          await driver.findElement({
            css: '[data-testid="send-page-amount-error"]',
            text: 'Insufficient funds for gas',
          });

          await inputAmount.press(driver.Key.BACK_SPACE);
          await inputAmount.press(driver.Key.BACK_SPACE);
          await inputAmount.press(driver.Key.BACK_SPACE);

          await driver.assertElementNotPresent('.send-v2__error-amount', {
            waitAtLeastGuard: 100, // A waitAtLeastGuard of 100ms is the best choice here
          });

          const amountMax = await driver.findClickableElement(
            '[data-testid="max-clear-button"]',
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
          await driver.clickElement({ text: 'Continue', tag: 'button' });

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

    /* eslint-disable-next-line mocha/max-top-level-suites */
    it('finds the transaction in the transactions list using advanced gas modal', async function () {
      if (process.env.MULTICHAIN) {
        return;
      }
      await withFixtures(
        {
          fixtures: new FixtureBuilder().build(),
          ganacheOptions: defaultGanacheOptions,
          defaultGanacheOptions,
          title: this.test.fullTitle(),
        },
        async ({ driver }) => {
          await unlockWallet(driver);

          await driver.delay(1000);

          await openActionMenuAndStartSendFlow(driver);
          await driver.fill(
            'input[placeholder="Enter public address (0x) or ENS name"]',
            '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
          );

          const inputAmount = await driver.findElement(
            'input[placeholder="0"]',
          );
          await inputAmount.fill('1');

          const inputValue = await inputAmount.getProperty('value');
          assert.equal(inputValue, '1');

          // Continue to next screen
          await driver.clickElement({ text: 'Continue', tag: 'button' });

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

    it('finds the transaction in the transactions list when sending to a Multisig Address', async function () {
      const smartContract = SMART_CONTRACTS.MULTISIG;
      await withFixtures(
        {
          fixtures: new FixtureBuilder().build(),
          ganacheOptions: {
            ...defaultGanacheOptions,
            hardfork: 'london',
          },
          smartContract,
          title: this.test.fullTitle(),
        },
        async ({ driver, contractRegistry }) => {
          const contractAddress = await contractRegistry.getContractAddress(
            smartContract,
          );
          await unlockWallet(driver);

          await driver.clickElement('[data-testid="eth-overview-send"]');
          await driver.fill(
            'input[placeholder="Enter public address (0x) or ENS name"]',
            contractAddress,
          );

          const inputAmount = await driver.findElement(
            'input[placeholder="0"]',
          );
          await inputAmount.fill('1');

          if (!process.env.MULTICHAIN) {
            // We need to wait for the text "Max Fee: 0.000xxxx ETH" before continuing
            await driver.findElement({ text: '0.000', tag: 'span' });
          }

          // Continue to next screen
          // We need to wait for the text "Max Fee" to be calculated before clicking Continue
          await driver.assertElementNotPresent({
            text: '0.000',
            tag: 'span',
          });
          await driver.clickElement({ text: 'Continue', tag: 'button' });
          await driver.clickElement({ text: 'Confirm', tag: 'button' });

          // Go back to home screen to check txn
          await driver.findElement({
            css: '[data-testid="eth-overview__primary-currency"]',
            text: '$42,496.38',
          });
          await driver.clickElement('[data-testid="home__activity-tab"]');

          await driver.findElement(
            '.transaction-list__completed-transactions .activity-list-item',
          );

          // The previous findElement already serves as the guard here for the assertElementNotPresent
          await driver.assertElementNotPresent(
            '.transaction-status-label--failed',
          );
        },
      );
    });

    it('shows no error when cancel transaction when sending via QR code', async function () {
      if (process.env.MULTICHAIN) {
        return;
      }
      await withFixtures(
        {
          fixtures: new FixtureBuilder().build(),
          ganacheOptions: defaultGanacheOptions,
          title: this.test.fullTitle(),
        },
        async ({ driver }) => {
          await unlockWallet(driver);

          await driver.assertElementNotPresent('.loading-overlay__spinner');
          await driver.findElement({
            css: '[data-testid="eth-overview__primary-currency"]',
            text: '$42,500.00',
          });

          await openActionMenuAndStartSendFlow(driver);
          // choose to scan via QR code
          await driver.clickElement('[data-testid="ens-qr-scan-button"]');
          await driver.findVisibleElement('[data-testid="qr-scanner-modal"]');
          // cancel action will close the dialog and shut down camera initialization
          await driver.waitForSelector({
            css: '.qr-scanner__error',
            text: "We couldn't access your camera. Please give it another try.",
          });
          await driver.clickElement({ text: 'Cancel', tag: 'button' });
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
            dapp: true,
            fixtures: new FixtureBuilder()
              .withPermissionControllerConnectedToTestDapp()
              .build(),
            ganacheOptions: defaultGanacheOptions,
            defaultGanacheOptions,
            title: this.test.fullTitle(),
          },
          async ({ driver }) => {
            await unlockWallet(driver);

            // initiates a send from the dapp
            await openDapp(driver);
            await driver.clickElement({ text: 'Send', tag: 'button' });
            const windowHandles = await driver.waitUntilXWindowHandles(3);
            const extension = windowHandles[0];
            await driver.switchToWindowWithTitle(
              WINDOW_TITLES.Dialog,
              windowHandles,
            );

            await driver.assertElementNotPresent(
              { text: 'Data', tag: 'li' },
              { findElementGuard: { text: 'Estimated gas fee', tag: 'h6' } }, // make sure the Dialog has loaded
            );

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
              tag: 'h1',
            });
            await editGasfeeForm(driver, '21000', '100');
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
              ...defaultGanacheOptions,
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
              WINDOW_TITLES.Dialog,
              windowHandles,
            );

            await driver.assertElementNotPresent(
              { text: 'Data', tag: 'li' },
              { findElementGuard: { text: 'Estimated fee', tag: 'p' } }, // make sure the Dialog has loaded
            );

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

            await driver.waitForSelector({
              css: '.currency-display-component__text',
              text: '0.0550741',
            });

            await driver.clickElement({ text: 'Confirm', tag: 'button' });
            await driver.waitUntilXWindowHandles(2);
            await driver.switchToWindow(extension);

            // Identify the transaction in the transactions list
            await driver.waitForSelector(
              '[data-testid="eth-overview__primary-currency"]',
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
        if (process.env.MULTICHAIN) {
          return;
        }
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
            ganacheOptions: defaultGanacheOptions,
            title: this.test.fullTitle(),
          },
          async ({ driver }) => {
            await unlockWallet(driver);

            await driver.assertElementNotPresent('.loading-overlay__spinner');
            await driver.findElement({
              css: '[data-testid="eth-overview__primary-currency"]',
              text: '$42,500.00',
            });

            await openActionMenuAndStartSendFlow(driver);

            await driver.fill(
              'input[placeholder="Enter public address (0x) or ENS name"]',
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

            await driver.findClickableElement(
              '[data-testid="sender-to-recipient__name"]',
            );
            await driver.clickElement(
              '[data-testid="sender-to-recipient__name"]',
            );

            const recipientAddress = await driver.findElements({
              text: '0xc427D562164062a23a5cFf596A4a3208e72Acd28',
            });

            assert.equal(recipientAddress.length, 1);
          },
        );
      });
    });
  });
});
