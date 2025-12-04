const { withFixtures } = require('../../helpers');
const { SMART_CONTRACTS } = require('../../seeder/smart-contracts');
const FixtureBuilder = require('../../fixtures/fixture-builder');
const {
  loginWithBalanceValidation,
} = require('../../page-objects/flows/login.flow');

const hexPrefixedAddress = '0x2f318C334780961FB129D2a6c30D0763d9a5C970';
const hexAbbreviatedAddress = '0x2f318...5C970';
const nonHexPrefixedAddress = hexPrefixedAddress.substring(2);

describe('Send ETH to a 40 character hexadecimal address', function () {
  it('should ensure the address is prefixed with 0x when pasted and should send ETH to a valid hexadecimal address', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withPreferencesControllerPetnamesDisabled()
          .build(),
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        // Send ETH
        await driver.clickElement('[data-testid="eth-overview-send"]');
        // Paste address without hex prefix
        await driver.pasteIntoField(
          'input[placeholder="Enter public address (0x) or domain name"]',
          nonHexPrefixedAddress,
        );
        await driver.findElement({
          css: '.ens-input__selected-input__title',
          text: '0x2f318...5C970',
        });
        await driver.clickElement({ text: 'Continue', tag: 'button' });

        // Confirm transaction
        await driver.clickElement({ text: 'Confirm', tag: 'button' });
        await driver.clickElement(
          '[data-testid="account-overview__activity-tab"]',
        );
        const sendTransactionListItem = await driver.findElement(
          '.transaction-list__completed-transactions .activity-list-item',
        );
        await sendTransactionListItem.click();
        await driver.clickElement({ text: 'Activity log', tag: 'summary' });

        // Verify address in activity log
        await driver.findElement({
          css: '.name__value',
          text: hexAbbreviatedAddress,
        });
      },
    );
  });

  it('should ensure the address is prefixed with 0x when typed and should send ETH to a valid hexadecimal address', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withPreferencesControllerPetnamesDisabled()
          .build(),
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        // Send ETH
        await driver.clickElement('[data-testid="eth-overview-send"]');
        // Type address without hex prefix
        await driver.fill(
          'input[placeholder="Enter public address (0x) or domain name"]',
          nonHexPrefixedAddress,
        );
        await driver.findElement({
          css: '.ens-input__selected-input__title',
          text: '0x2f318...5C970',
        });
        await driver.clickElement({ text: 'Continue', tag: 'button' });

        // Confirm transaction
        await driver.clickElement({ text: 'Confirm', tag: 'button' });
        await driver.clickElement(
          '[data-testid="account-overview__activity-tab"]',
        );
        await driver.clickElement(
          '.transaction-list__completed-transactions .activity-list-item',
        );
        await driver.clickElement({ text: 'Activity log', tag: 'summary' });

        // Verify address in activity log
        await driver.findElement({
          css: '.name__value',
          text: hexAbbreviatedAddress,
        });
      },
    );
  });
});

describe('Send ERC20 to a 40 character hexadecimal address', function () {
  const smartContract = SMART_CONTRACTS.HST;

  it('should ensure the address is prefixed with 0x when pasted and should send TST to a valid hexadecimal address', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilder()
          .withPreferencesControllerPetnamesDisabled()
          .withTokensControllerERC20()
          .build(),
        smartContract,
        title: this.test.fullTitle(),
      },
      async ({ driver, localNodes }) => {
        await loginWithBalanceValidation(driver, localNodes[0]);

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
          'input[placeholder="Enter public address (0x) or domain name"]',
          nonHexPrefixedAddress,
        );
        await driver.findElement({
          css: '.ens-input__selected-input__title',
          text: '0x2f318...5C970',
        });

        await driver.clickElement({ text: 'Continue', tag: 'button' });

        // Confirm transaction
        await driver.findElement({
          css: 'h2',
          text: '0 ETH',
        });
        await driver.clickElement({ text: 'Confirm', tag: 'button' });
        await driver.clickElement(
          '[data-testid="account-overview__activity-tab"]',
        );
        await driver.findElement(
          '.transaction-list__completed-transactions .activity-list-item:nth-of-type(1)',
        );
        const sendTransactionListItem = await driver.findElement(
          '.transaction-list__completed-transactions .activity-list-item:nth-of-type(1)',
        );
        await sendTransactionListItem.click();
        await driver.clickElement({ text: 'Activity log', tag: 'summary' });

        // Verify address in activity log
        await driver.findElement({
          css: '.name__value',
          text: hexAbbreviatedAddress,
        });
      },
    );
  });

  it('should ensure the address is prefixed with 0x when typed and should send TST to a valid hexadecimal address', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilder()
          .withPreferencesControllerPetnamesDisabled()
          .withTokensControllerERC20()
          .build(),
        smartContract,
        title: this.test.fullTitle(),
      },
      async ({ driver, localNodes }) => {
        await loginWithBalanceValidation(driver, localNodes[0]);

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
          'input[placeholder="Enter public address (0x) or domain name"]',
          nonHexPrefixedAddress,
        );
        await driver.findElement({
          css: '.ens-input__selected-input__title',
          text: '0x2f318...5C970',
        });

        await driver.clickElement({ text: 'Continue', tag: 'button' });

        // Confirm transaction
        await driver.findElement({
          css: 'h2',
          text: '0 ETH',
        });
        await driver.clickElement({ text: 'Confirm', tag: 'button' });
        await driver.clickElement(
          '[data-testid="account-overview__activity-tab"]',
        );
        await driver.findElement(
          '.transaction-list__completed-transactions .activity-list-item:nth-of-type(1)',
        );
        const sendTransactionListItem = await driver.findElement(
          '.transaction-list__completed-transactions .activity-list-item:nth-of-type(1)',
        );
        await sendTransactionListItem.click();
        await driver.clickElement({ text: 'Activity log', tag: 'summary' });

        // Verify address in activity log
        await driver.findElement({
          css: '.name__value',
          text: hexAbbreviatedAddress,
        });
      },
    );
  });
});
