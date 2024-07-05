const {
  defaultGanacheOptions,
  withFixtures,
  logInWithBalanceValidation,
  openActionMenuAndStartSendFlow,
} = require('../../helpers');
const { SMART_CONTRACTS } = require('../../seeder/smart-contracts');
const FixtureBuilder = require('../../fixture-builder');
const HomePage = require('../../page-objects/pages/homepage');
const sendTransaction = require('../../page-objects/processes/send-transaction.process');

const hexPrefixedAddress = '0x2f318C334780961FB129D2a6c30D0763d9a5C970';
const nonHexPrefixedAddress = hexPrefixedAddress.substring(2);

describe('Send ETH to a 40 character hexadecimal address', function () {
  it('should ensure the address is prefixed with 0x when pasted and should send ETH to a valid hexadecimal address', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withPreferencesControllerPetnamesDisabled()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver, ganacheServer }) => {
        await logInWithBalanceValidation(driver, ganacheServer);

        // Send ETH and paste address without hex prefix as recipient
        await sendTransaction(
          driver,
          nonHexPrefixedAddress,
          '1',
          '0.000042',
          '1.000042',
        );

        // Verify address in activity log
        const homePage = new HomePage(driver);
        await homePage.check_confirmedTxNumberDisplayedInActivity();
        await homePage.check_txRecipientInActivity(hexPrefixedAddress);
      },
    );
  });
  it('should ensure the address is prefixed with 0x when typed and should send ETH to a valid hexadecimal address', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withPreferencesControllerPetnamesDisabled()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver, ganacheServer }) => {
        await logInWithBalanceValidation(driver, ganacheServer);

        // Send ETH
        await openActionMenuAndStartSendFlow(driver);
        // Type address without hex prefix
        await driver.fill(
          'input[placeholder="Enter public address (0x) or ENS name"]',
          nonHexPrefixedAddress,
        );
        await driver.findElement({
          css: '.ens-input__selected-input__title',
          text: '0x2f318...5C970',
        });
        await driver.clickElement({ text: 'Continue', tag: 'button' });

        // Confirm transaction
        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        // Verify address in activity log
        const homePage = new HomePage(driver);
        await homePage.check_confirmedTxNumberDisplayedInActivity();
        await homePage.check_txRecipientInActivity(hexPrefixedAddress);
      },
    );
  });
});

describe('Send ERC20 to a 40 character hexadecimal address', function () {
  const smartContract = SMART_CONTRACTS.HST;

  it('should ensure the address is prefixed with 0x when pasted and should send TST to a valid hexadecimal address', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPreferencesControllerPetnamesDisabled()
          .withTokensControllerERC20()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        smartContract,
        title: this.test.fullTitle(),
      },
      async ({ driver, ganacheServer }) => {
        await logInWithBalanceValidation(driver, ganacheServer);

        // Send TST
        await driver.clickElement(
          '[data-testid="account-overview__asset-tab"]',
        );
        await driver.clickElement(
          '[data-testid="multichain-token-list-button"]',
        );
        await driver.clickElement('[data-testid="coin-overview-send"]');
        // Paste address without hex prefix
        await driver.pasteIntoField(
          'input[placeholder="Enter public address (0x) or ENS name"]',
          nonHexPrefixedAddress,
        );
        await driver.findElement({
          css: '.ens-input__selected-input__title',
          text: '0x2f318...5C970',
        });

        await driver.clickElement({ text: 'Continue', tag: 'button' });

        // Confirm transaction
        await driver.findElement({
          css: '.confirm-page-container-summary__title',
          text: '0',
        });
        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        // Verify address in activity log
        const homePage = new HomePage(driver);
        await homePage.check_confirmedTxNumberDisplayedInActivity();
        await homePage.check_txRecipientInActivity(hexPrefixedAddress);
      },
    );
  });
  it('should ensure the address is prefixed with 0x when typed and should send TST to a valid hexadecimal address', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPreferencesControllerPetnamesDisabled()
          .withTokensControllerERC20()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        smartContract,
        title: this.test.fullTitle(),
      },
      async ({ driver, ganacheServer }) => {
        await logInWithBalanceValidation(driver, ganacheServer);
        // Send TST
        await driver.clickElement(
          '[data-testid="account-overview__asset-tab"]',
        );
        await driver.clickElement(
          '[data-testid="multichain-token-list-button"]',
        );
        await driver.clickElement('[data-testid="coin-overview-send"]');

        // Type address without hex prefix
        await driver.fill(
          'input[placeholder="Enter public address (0x) or ENS name"]',
          nonHexPrefixedAddress,
        );
        await driver.findElement({
          css: '.ens-input__selected-input__title',
          text: '0x2f318...5C970',
        });

        await driver.clickElement({ text: 'Continue', tag: 'button' });

        // Confirm transaction
        await driver.findElement({
          css: '.confirm-page-container-summary__title',
          text: '0',
        });
        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        const homePage = new HomePage(driver);
        await homePage.check_confirmedTxNumberDisplayedInActivity();
        await homePage.check_txRecipientInActivity(hexPrefixedAddress);
      },
    );
  });
});
