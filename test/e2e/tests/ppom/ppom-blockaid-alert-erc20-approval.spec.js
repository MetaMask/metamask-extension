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
  BUSD: '0x4fabb145d64652a948d72533023f6e7a623c7c53',
  BUSDImplementation: '0x2a3f1a37c04f82aa274f5353834b2d002db91015',
  OffChainOracle: '0x52cbe0f49ccdd4dc6e9c13bab024eabd2842045b',
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
            to: CONTRACT_ADDRESS.BUSD,
          },
        ],
      },
    ],
    [
      'eth_call',
      {
        methodResultVariant: 'balanceApprove',
        params: [
          {
            data: `0x70a08231000000000000000000000000${selectedAddressWithoutPrefix}`,
            to: CONTRACT_ADDRESS.BUSD,
          },
        ],
      },
    ],
    ['eth_estimateGas'],
    ['eth_feeHistory'],
    ['eth_gasPrice'],
    ['eth_getBalance'],
    ['eth_getBlockByNumber'],
    ['eth_createAccessList'],
    ['trace_call'],
    [
      'eth_getStorageAt',
      {
        methodResultVariant: 'BUSD_STORAGE_1',
        params: [
          '0x10d6a54a4754c8869d6886b5f5d7fbfa5b4522237ea5c60d11bc4e7a1ff9390b',
        ],
      },
    ],
    [
      'eth_getStorageAt',
      {
        methodResultVariant: 'BUSD_STORAGE_2',
        params: [
          '0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3',
        ],
      },
    ],
    [
      'eth_getCode',
      {
        methodResultVariant: 'BUSD',
        params: [CONTRACT_ADDRESS.BUSD],
      },
    ],
    [
      'eth_getCode',
      {
        methodResultVariant: 'BUSD_IMPL',
        params: [CONTRACT_ADDRESS.BUSDImplementation],
      },
    ],
    [
      'eth_getCode',
      {
        methodResultVariant: 'SELECTED_ADDR',
        params: [selectedAddress],
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
                from: CONTRACT_ADDRESS.BUSD,
                gas: '0x1d55c2cb',
                gasUsed: '0x39c',
                input: '0x00000000',
                to: CONTRACT_ADDRESS.BUSDImplementation,
                type: 'DELEGATECALL',
                value: '0x0',
              },
            ],
            error: 'execution reverted',
            from: '0x0000000000000000000000000000000000000000',
            gas: '0x1dcd6500',
            gasUsed: '0x721e',
            input: '0x00000000',
            to: CONTRACT_ADDRESS.BUSD,
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
      params: [
        {
          data: '0x095ea7b3000000000000000000000000e50a2dbc466d01a34c3e8b7e8e45fce4f7da39e6000000000000000000000000000000000000000000000000ffffffffffffffff',
        },
      ],
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
                from: CONTRACT_ADDRESS.BUSD,
                gas: '0x291ee',
                gasUsed: '0x79bb',
                input:
                  '0x095ea7b3000000000000000000000000e50a2dbc466d01a34c3e8b7e8e45fce4f7da39e6000000000000000000000000000000000000000000000000ffffffffffffffff',
                logs: [
                  {
                    address: CONTRACT_ADDRESS.BUSD,
                    data: '0x000000000000000000000000000000000000000000000000ffffffffffffffff',
                    topics: [
                      '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925',
                      `0x000000000000000000000000${selectedAddressWithoutPrefix}`,
                      '0x000000000000000000000000e50a2dbc466d01a34c3e8b7e8e45fce4f7da39e6',
                    ],
                  },
                ],
                output:
                  '0x0000000000000000000000000000000000000000000000000000000000000001',
                to: CONTRACT_ADDRESS.BUSDImplementation,
                type: 'DELEGATECALL',
                value: '0x0',
              },
            ],
            from: selectedAddress,
            gas: '0x30d40',
            gasUsed: '0xeac5',
            input:
              '0x095ea7b3000000000000000000000000e50a2dbc466d01a34c3e8b7e8e45fce4f7da39e6000000000000000000000000000000000000000000000000ffffffffffffffff',
            output:
              '0x0000000000000000000000000000000000000000000000000000000000000001',
            to: CONTRACT_ADDRESS.BUSD,
            type: 'CALL',
            value: '0x0',
          },
        },
      };
    });
}

describe('PPOM Blockaid Alert - Malicious ERC20 Approval @no-mmi', function () {
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
        await unlockWallet(driver);
        await openDapp(driver);

        const expectedTitle = 'This is a deceptive request';
        const expectedDescription =
          'If you approve this request, you might lose your assets.';

        // Click TestDapp button to send JSON-RPC request
        await driver.clickElement('#maliciousApprovalButton');

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
          `Banner alert not found. Expected Title: ${expectedTitle} \nExpected reason: approval_farming\n`,
        );
        assert(
          bannerAlertText.includes(expectedDescription),
          `Unexpected banner alert description. Expected: ${expectedDescription} \nExpected reason: approval_farming\n`,
        );
      },
    );
  });
});
