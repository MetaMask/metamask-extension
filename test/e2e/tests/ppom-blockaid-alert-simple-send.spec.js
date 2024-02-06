const { strict: assert } = require('assert');
const FixtureBuilder = require('../fixture-builder');
const { mockServerJsonRpc } = require('../mock-server-json-rpc');

const {
  defaultGanacheOptions,
  withFixtures,
  sendScreenToConfirmScreen,
  unlockWallet,
} = require('../helpers');

const bannerAlertSelector = '[data-testid="security-provider-banner-alert"]';

async function mockInfura(mockServer) {
  await mockServerJsonRpc(mockServer, [
    ['eth_blockNumber'],
    ['eth_call'],
    ['eth_estimateGas'],
    ['eth_feeHistory'],
    ['eth_gasPrice'],
    ['eth_getBalance'],
    ['eth_getBlockByNumber'],
    ['eth_getCode'],
    ['eth_getTransactionCount'],
  ]);
}

/**
 * Tests various Blockaid PPOM security alerts. Some other tests live in separate files due to
 * the need for more sophisticated JSON-RPC mock requests. Some example PPOM Blockaid
 * requests and responses are provided here:
 *
 * @see {@link https://wobbly-nutmeg-8a5.notion.site/MM-E2E-Testing-1e51b617f79240a49cd3271565c6e12d}
 */
describe('Simple Send Security Alert - Blockaid @no-mmi', function () {
  /**
   * todo: fix test
   *
   * @see {@link https://github.com/MetaMask/MetaMask-planning/issues/1766}
   */
  // eslint-disable-next-line mocha/no-skipped-tests
  it('should not show security alerts for benign requests', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withPreferencesController({
            securityAlertsEnabled: true,
          })
          .build(),
        defaultGanacheOptions,
        testSpecificMock: mockInfura,
        title: this.test.fullTitle(),
      },

      async ({ driver }) => {
        await unlockWallet(driver);

        await sendScreenToConfirmScreen(
          driver,
          '0x50587E46C5B96a3F6f9792922EC647F13E6EFAE4',
          '1',
        );
        const isPresent = await driver.isElementPresent(bannerAlertSelector);
        assert.equal(isPresent, false, `Banner alert unexpectedly found.`);
      },
    );
  });
});
