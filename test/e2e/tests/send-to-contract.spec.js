const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures, unlockWallet } = require('../helpers');
const { SMART_CONTRACTS } = require('../seeder/smart-contracts');
const FixtureBuilder = require('../fixture-builder');

describe('Send ERC20 token to contract address', function () {
  const smartContract = SMART_CONTRACTS.HST;
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };
  it('should display the token contract warning to the user', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().withTokensControllerERC20().build(),
        ganacheOptions,
        smartContract,
        title: this.test.fullTitle(),
        failOnConsoleError: false,
      },
      async ({ driver, contractRegistry }) => {
        const contractAddress = await contractRegistry.getContractAddress(
          smartContract,
        );
        await unlockWallet(driver);

        // Send TST
        await driver.clickElement('[data-testid="home__asset-tab"]');
        await driver.clickElement(
          '[data-testid="multichain-token-list-button"]',
        );
        if (process.env.MULTICHAIN) {
          return;
        }
        await driver.clickElement('[data-testid="eth-overview-send"]');

        // Type contract address
        await driver.fill(
          'input[placeholder="Enter public address (0x) or ENS name"]',
          contractAddress,
        );

        // Verify warning
        const warningText =
          'Warning: you are about to send to a token contract which could result in a loss of funds. Learn more\nI understand';
        const warning = await driver.findElement('.send__warning-container');
        assert.equal(await warning.getText(), warningText);
      },
    );
  });
});
