const FixtureBuilder = require('../../fixture-builder');

const {
  WINDOW_TITLES,
  defaultGanacheOptions,
  unlockWallet,
  withFixtures,
} = require('../../helpers');
const { mockSecurityAlertsAPIFailed } = require('./utils');
const { mockServerJsonRpc } = require('./mocks/mock-server-json-rpc');

const selectedAddress = '0x5cfe73b6021e818b776b421b1c4db2474086a7e1';
const selectedAddressWithoutPrefix = '5cfe73b6021e818b776b421b1c4db2474086a7e1';

const CONTRACT_ADDRESS = {
  BalanceChecker: '0xb1f8e55c7f64d203c1400b9d8555d050f94adf39',
  FiatTokenV2_1: '0xa2327a938febf5fec13bacfb16ae10ecbc4cbdcf',
  OffChainOracle: '0x52cbe0f49ccdd4dc6e9c13bab024eabd2842045b',
  USDC: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
};

async function mockInfura(mockServer) {
  await mockSecurityAlertsAPIFailed(mockServer);

  await mockServerJsonRpc(mockServer, [
    ['eth_blockNumber'],
    [
      'eth_call',
      {
        methodResultVariant: 'balanceChecker',
        params: [{ to: CONTRACT_ADDRESS.BalanceChecker }],
      },
      {
        result: '0x3635c9adc5dea00000',
      },
    ],
    [
      'eth_call',
      {
        methodResultVariant: 'offchainOracle',
        params: [{ to: CONTRACT_ADDRESS.OffChainOracle }],
      },
    ],
    [
      'eth_call',
      {
        methodResultVariant: 'balance',
        params: [
          {
            accessList: [],
            data: `0x70a08231000000000000000000000000${selectedAddressWithoutPrefix}`,
            to: CONTRACT_ADDRESS.USDC,
          },
        ],
      },
      {
        result: '0x3635c9adc5dea00000',
      },
    ],
    ['eth_estimateGas'],
    ['eth_feeHistory'],
    ['eth_gasPrice'],
    ['eth_getBalance'],
    ['eth_getBlockByNumber'],
    [
      'eth_getCode',
      {
        methodResultVariant: 'USDC',
        params: [CONTRACT_ADDRESS.USDC],
      },
    ],
    ['eth_getTransactionCount'],
  ]);

  await mockServer
    .forPost()
    .withJsonBodyIncluding({
      method: 'debug_traceCall',
      params: [{ accessList: [], data: '0x00000000' }],
    })
    .thenCallback(async (req) => {
      return {
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: (await req.body.getJson()).id,
          result: {
            calls: [
              {
                error: 'execution reverted',
                from: CONTRACT_ADDRESS.USDC,
                gas: '0x1d55c2c7',
                gasUsed: '0xf0',
                input: '0x00000000',
                to: CONTRACT_ADDRESS.FiatTokenV2_1,
                type: 'DELEGATECALL',
                value: '0x1',
              },
            ],
            error: 'execution reverted',
            from: '0x0000000000000000000000000000000000000000',
            gas: '0x1dcd6500',
            gasUsed: '0x6f79',
            input: '0x00000000',
            to: CONTRACT_ADDRESS.USDC,
            type: 'CALL',
            value: '0x1',
          },
        },
      };
    });

  await mockServer
    .forPost()
    .withJsonBodyIncluding({
      method: 'debug_traceCall',
      params: [{ from: selectedAddress }],
    })
    .thenCallback(async (req) => {
      const mockFakePhishingAddress =
        '5fbdb2315678afecb367f032d93f642f64180aa3';

      return {
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: (await req.body.getJson()).id,
          result: {
            calls: [
              {
                from: CONTRACT_ADDRESS.USDC,
                gas: '0x2923d',
                gasUsed: '0x4cac',
                input: `0xa9059cbb000000000000000000000000${mockFakePhishingAddress}0000000000000000000000000000000000000000000000000000000000000064`,
                logs: [
                  {
                    address: CONTRACT_ADDRESS.USDC,
                    data: '0x0000000000000000000000000000000000000000000000000000000000000064',
                    topics: [
                      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
                      `0x000000000000000000000000${selectedAddressWithoutPrefix}`,
                      `0x000000000000000000000000${mockFakePhishingAddress}`,
                    ],
                  },
                ],
                output:
                  '0x0000000000000000000000000000000000000000000000000000000000000001',
                to: CONTRACT_ADDRESS.FiatTokenV2_1,
                type: 'DELEGATECALL',
                value: '0x1',
              },
            ],
            from: selectedAddress,
            gas: '0x30d40',
            gasUsed: '0xbd69',
            input: `0xa9059cbb000000000000000000000000${mockFakePhishingAddress}0000000000000000000000000000000000000000000000000000000000000064`,
            output:
              '0x0000000000000000000000000000000000000000000000000000000000000001',
            to: CONTRACT_ADDRESS.USDC,
            type: 'CALL',
            value: '0x1',
          },
        },
      };
    });
}

describe('PPOM Blockaid Alert - Malicious ERC20 Transfer', function () {
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
        title: this.test.fullTitle(),
      },

      async ({ driver }) => {
        const expectedTitle = 'This is a deceptive request';
        const expectedDescription =
          'If you approve this request, a third party known for scams will take all your assets.';

        await unlockWallet(driver);
        await driver.openNewPage('http://localhost:8080');

        // Click TestDapp button to send JSON-RPC request
        await driver.clickElement('#maliciousERC20TransferButton');

        // Wait for confirmation pop-up
        await driver.waitUntilXWindowHandles(3);
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
