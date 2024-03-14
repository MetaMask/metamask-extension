const { strict: assert } = require('assert');
const FixtureBuilder = require('../../fixture-builder');
const { mockServerJsonRpc } = require('../../mock-server-json-rpc');

const {
  WINDOW_TITLES,
  defaultGanacheOptions,
  openDapp,
  unlockWallet,
  withFixtures,
} = require('../../helpers');

const bannerAlertSelector = '[data-testid="security-provider-banner-alert"]';

const selectedAddress = '0x5cfe73b6021e818b776b421b1c4db2474086a7e1';
const selectedAddressWithoutPrefix = '5cfe73b6021e818b776b421b1c4db2474086a7e1';

const CONTRACT_ADDRESS = {
  BalanceChecker: '0xb1f8e55c7f64d203c1400b9d8555d050f94adf39',
  FiatTokenV2_1: '0xa2327a938febf5fec13bacfb16ae10ecbc4cbdcf',
  OffChainOracle: '0x52cbe0f49ccdd4dc6e9c13bab024eabd2842045b',
  USDC: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
};

async function mockInfura(mockServer) {
  await mockServerJsonRpc(mockServer, [
    ['eth_blockNumber'],
    [
      'eth_call',
      {
        methodResultVariant: 'balanceChecker',
        params: [{ to: CONTRACT_ADDRESS.BalanceChecker }],
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
                value: '0x0',
              },
            ],
            error: 'execution reverted',
            from: '0x0000000000000000000000000000000000000000',
            gas: '0x1dcd6500',
            gasUsed: '0x6f79',
            input: '0x00000000',
            to: CONTRACT_ADDRESS.USDC,
            type: 'CALL',
            value: '0x0',
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
                value: '0x0',
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
            value: '0x0',
          },
        },
      };
    });
}

describe('PPOM Blockaid Alert - Malicious ERC20 Transfer @no-mmi', function () {
  // eslint-disable-next-line mocha/no-skipped-tests
  it.skip('should show banner alert', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withPermissionControllerConnectedToTestDapp()
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
          'If you approve this request, you might lose your assets.';

        await unlockWallet(driver);
        await openDapp(driver);

        // Click TestDapp button to send JSON-RPC request
        await driver.clickElement('#maliciousERC20TransferButton');

        // Wait for confirmation pop-up
        await driver.waitUntilXWindowHandles(3);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await driver.assertElementNotPresent('.loading-indicator');

        const bannerAlertFoundByTitle = await driver.findElement({
          css: bannerAlertSelector,
          text: expectedTitle,
        });
        const bannerAlertText = await bannerAlertFoundByTitle.getText();

        assert(
          bannerAlertFoundByTitle,
          `Banner alert not found. Expected Title: ${expectedTitle} \nExpected reason: transfer_farming\n`,
        );
        assert(
          bannerAlertText.includes(expectedDescription),
          `Unexpected banner alert description. Expected: ${expectedDescription} \nExpected reason: transfer_farming\n`,
        );
      },
    );
  });
});
