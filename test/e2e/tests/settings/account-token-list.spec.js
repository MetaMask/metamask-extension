const { strict: assert } = require('assert');
const {
  withFixtures,
  defaultGanacheOptions,
  logInWithBalanceValidation,
  unlockWallet,
} = require('../../helpers');
const {
  switchToNetworkFlow,
} = require('../../page-objects/flows/network.flow');

const { mockServerJsonRpc } = require('../ppom/mocks/mock-server-json-rpc');
const FixtureBuilder = require('../../fixture-builder');

const infuraSepoliaUrl =
  'https://sepolia.infura.io/v3/00000000000000000000000000000000';

async function mockInfura(mockServer) {
  await mockServerJsonRpc(mockServer, [
    ['eth_blockNumber'],
    ['eth_getBlockByNumber'],
  ]);
  await mockServer
    .forPost(infuraSepoliaUrl)
    .withJsonBodyIncluding({ method: 'eth_getBalance' })
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        jsonrpc: '2.0',
        id: '6857940763865360',
        result: '0x15af1d78b58c40000',
      },
    }));
}

async function mockInfuraResponses(mockServer) {
  await mockInfura(mockServer);
}

describe('Settings', function () {
  it('Should match the value of token list item and account list item for eth conversion', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().withConversionRateDisabled().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver, ganacheServer }) => {
        await logInWithBalanceValidation(driver, ganacheServer);

        await driver.clickElement(
          '[data-testid="account-overview__asset-tab"]',
        );
        const tokenValue = '25 ETH';
        const tokenListAmount = await driver.findElement(
          '[data-testid="multichain-token-list-item-value"]',
        );
        await driver.waitForNonEmptyElement(tokenListAmount);
        assert.equal(await tokenListAmount.getText(), tokenValue);

        await driver.clickElement('[data-testid="account-menu-icon"]');
        const accountTokenValue = await driver.waitForSelector(
          '.multichain-account-list-item .multichain-account-list-item__avatar-currency .currency-display-component__text',
        );

        assert.equal(await accountTokenValue.getText(), '25', 'ETH');
      },
    );
  });

  it('Should match the value of token list item and account list item for fiat conversion', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withConversionRateEnabled()
          .withShowFiatTestnetEnabled()
          .withPreferencesControllerShowNativeTokenAsMainBalanceDisabled()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
        testSpecificMock: mockInfuraResponses,
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await driver.clickElement('[data-testid="popover-close"]');
        await driver.clickElement(
          '[data-testid="account-overview__asset-tab"]',
        );

        const tokenListAmount = await driver.findElement(
          '.eth-overview__primary-container',
        );
        await driver.delay(1000);
        assert.equal(await tokenListAmount.getText(), '$42,500.00\nUSD');

        // switch to Sepolia
        // the account list item used to always show account.balance as long as its EVM network.
        // Now we are showing aggregated fiat balance on non testnetworks; but if it is a testnetwork we will show account.balance.
        // The current test was running initially on localhost
        // which is not a testnetwork resulting in the code trying to calculate the aggregated total fiat balance which shows 0.00$
        // If this test switches to mainnet then switches back to localhost; the test will pass because switching to mainnet
        // will make the code calculate the aggregate fiat balance on mainnet+Linea mainnet and because this account in this test
        // has 42,500.00 native Eth on mainnet then the aggregated total fiat would be 42,500.00. When the user switches back to localhost
        // it will show the total that the test is expecting.

        // I think we can slightly modify this test to switch to Sepolia network before checking the account List item value
        await switchToNetworkFlow(driver, 'Sepolia');

        await driver.clickElement('[data-testid="account-menu-icon"]');
        const accountTokenValue = await driver.waitForSelector(
          '.multichain-account-list-item .multichain-account-list-item__asset',
        );

        assert.equal(await accountTokenValue.getText(), '$42,500.00USD');
      },
    );
  });

  it('Should show crypto value when price checker setting is off', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withConversionRateEnabled()
          .withShowFiatTestnetEnabled()
          .withPreferencesControllerShowNativeTokenAsMainBalanceDisabled()
          .withConversionRateDisabled()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
        testSpecificMock: mockInfuraResponses,
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await driver.clickElement('[data-testid="popover-close"]');
        await driver.clickElement(
          '[data-testid="account-overview__asset-tab"]',
        );

        const tokenListAmount = await driver.findElement(
          '.eth-overview__primary-container',
        );
        await driver.delay(1000);
        assert.equal(await tokenListAmount.getText(), '25\nETH');

        await driver.clickElement('[data-testid="account-menu-icon"]');
        const accountTokenValue = await driver.waitForSelector(
          '.multichain-account-list-item .multichain-account-list-item__asset',
        );

        assert.equal(await accountTokenValue.getText(), '25ETH');
      },
    );
  });
});
