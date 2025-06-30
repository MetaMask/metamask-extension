const { strict: assert } = require('assert');
const {
  defaultGanacheOptions,
  withFixtures,
  unlockWallet,
} = require('../../helpers');
const { SMART_CONTRACTS } = require('../../seeder/smart-contracts');
const FixtureBuilder = require('../../fixture-builder');

describe('Send ERC20 token to contract address', function () {
  const smartContract = SMART_CONTRACTS.HST;

  it('should display the token contract warning to the user', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().withTokensControllerERC20().build(),
        ganacheOptions: defaultGanacheOptions,
        smartContract,
        title: this.test.fullTitle(),
      },
      async ({ driver, contractRegistry }) => {
        const contractAddress = await contractRegistry.getContractAddress(
          smartContract,
        );
        await unlockWallet(driver);

        // Send TST
        await driver.clickElement(
          '[data-testid="account-overview__asset-tab"]',
        );
        await driver.clickElement(
          '[data-testid="multichain-token-list-button"]',
        );
        await driver.clickElement('[data-testid="coin-overview-send"]');

        // Type contract address
        await driver.fill(
          'input[placeholder="Enter public address (0x) or domain name"]',
          contractAddress,
        );

        // Verify warning
        const warningText =
          'Warning: you are about to send to a token contract which could result in a loss of funds. Learn more';
        const warning = await driver.findElement(
          '[data-testid="send-warning"] .mm-box--min-width-0 span',
        );
        assert.equal(await warning.getText(), warningText);
      },
    );
  });
});
