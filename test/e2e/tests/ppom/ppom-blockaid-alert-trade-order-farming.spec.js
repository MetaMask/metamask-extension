const FixtureBuilder = require('../../fixture-builder');

const {
  WINDOW_TITLES,
  defaultGanacheOptions,
  unlockWallet,
  withFixtures,
} = require('../../helpers');
const { mockServerJsonRpc } = require('./mocks/mock-server-json-rpc');

const CONTRACT_ADDRESS = {
  WrappedEther: 'c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  OffchainOracle: '0x52cbe0f49ccdd4dc6e9c13bab024eabd2842045b',
  TetherToken: 'dac17f958d2ee523a2206206994597c13d831ec7',
};

async function mockInfura(mockServer) {
  await mockServerJsonRpc(mockServer, [
    ['eth_blockNumber'],
    [
      'eth_call',
      {
        params: [
          {
            accessList: [],
            data: '0x06fdde03',
            to: CONTRACT_ADDRESS.WrappedEther,
            type: '0x02',
          },
        ],
      },
    ],
    [
      'eth_call',
      {
        methodResultVariant: 'symbol',
        params: [
          {
            accessList: [],
            data: '0x95d89b41',
            to: CONTRACT_ADDRESS.WrappedEther,
            type: '0x02',
          },
          '0x11a7e9a',
        ],
      },
    ],
    [
      'eth_call',
      {
        methodResultVariant: 'decimals',
        params: [
          {
            accessList: [],
            data: '0x313ce567',
            to: CONTRACT_ADDRESS.WrappedEther,
            type: '0x02',
          },
          '0x11a7e9a',
        ],
      },
    ],
    [
      'eth_call',
      {
        methodResultVariant: 'getRateWithThreshold',
        params: [
          {
            accessList: [],
            data: `0x6744d6c7000000000000000000000000${CONTRACT_ADDRESS.WrappedEther}000000000000000000000000${CONTRACT_ADDRESS.TetherToken}00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000063`,
            to: CONTRACT_ADDRESS.OffchainOracle,
            type: '0x02',
          },
          '0x11a7e9a',
        ],
      },
    ],
    ['eth_estimateGas'],
    ['eth_feeHistory'],
    ['eth_gasPrice'],
    ['eth_getBalance'],
    ['eth_getBlockByNumber'],
    ['eth_getCode'],
    ['eth_getTransactionCount'],
  ]);
}

describe('PPOM Blockaid Alert - Set Trade farming order @no-mmi', function () {
  it('should show banner alert', async function () {
    // we need to use localhost instead of the ip
    // see issue: https://github.com/MetaMask/MetaMask-planning/issues/3560
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withPermissionControllerConnectedToTestDapp({
            useLocalhostHostname: true,
          })
          .withPreferencesController({
            securityAlertsEnabled: true,
          })
          .build(),
        defaultGanacheOptions,
        testSpecificMock: mockInfura,
        title: this.test.title,
      },

      async ({ driver }) => {
        await unlockWallet(driver);
        await driver.openNewPage('http://localhost:8080');

        const expectedTitle = 'This is a deceptive request';
        const expectedDescription =
          'If you approve this request, you might lose your assets.';

        // Click TestDapp button to send JSON-RPC request
        await driver.clickElement('#maliciousTradeOrder');
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await driver.assertElementNotPresent('.loading-indicator');

        await driver.waitForSelector({
          css: '.mm-text--body-lg-medium',
          text: expectedTitle,
        });

        await driver.waitForSelector({
          css: '.mm-text--body-md',
          text: expectedDescription,
        });
      },
    );
  });
});
