const { strict: assert } = require('assert');
const FixtureBuilder = require('../../fixture-builder');

const {
  WINDOW_TITLES,
  defaultGanacheOptions,
  openDapp,
  unlockWallet,
  withFixtures,
} = require('../../helpers');
const { mockServerJsonRpc } = require('./mocks/mock-server-json-rpc');

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
    ['eth_getBlockByNumber'],
    [
      'eth_call',
      {
        params: [
          { to: '0xb1f8e55c7f64d203c1400b9d8555d050f94adf39', data: '0xf0002ea9000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000020000000000000000000000004703d823a763c82a6301d391f2d5f7ca2ec3b3dd000000000000000000000000e5d20df6ac1d7f9d01c02af2cbceb5a98b2eb59e00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000' },
          '0x13fff1e'
        ],
      },
    ],
    [
      'eth_getCode',
      {
        params: ['0x00008f1149168c1d2fa1eba1ad3e9cd644510000', '0x13fff1e'],
      },
    ],
    ['eth_estimateGas'],
    [
      'eth_call',
      {
        params: [
          { to: '0x00008f1149168c1d2fa1eba1ad3e9cd644510000', data: '0x01ffc9a780ac58cd00000000000000000000000000000000000000000000000000000000' },
          '0x13fff1e'
        ],
      },
    ],
    ['eth_getBalance'],
    [
      'eth_call',
      {
        params: [
          { to: '0x00008f1149168c1d2fa1eba1ad3e9cd644510000', data: '0x01ffc9a7d9b67a2600000000000000000000000000000000000000000000000000000000' },
          '0x13fff1e'
        ],
      },
    ],
    [
      'eth_call',
      {
        params: [
          { to: '0x00008f1149168c1d2fa1eba1ad3e9cd644510000', data: '0x95d89b41' },
          '0x13fff1e'
        ],
      },
    ],
    [
      'eth_call',
      {
        params: [
          { to: '0x00008f1149168c1d2fa1eba1ad3e9cd644510000', data: '0x313ce567' },
          '0x13fff1e'
        ],
      },
    ],
    [
      'eth_call',
      {
        params: [
          { to: '0x00008f1149168c1d2fa1eba1ad3e9cd644510000', data: '0x01ffc9a780ac58cd00000000000000000000000000000000000000000000000000000000' },
          '0x13fff1e'
        ],
      },
    ],
    [
      'eth_getStorageAt',
      {
        params: [
          '0x00008f1149168c1d2fa1eba1ad3e9cd644510000',
          '0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3',
          '0x13fff1e'
        ],
      },
    ],
    [
      'eth_getStorageAt',
      {
        params: [
          '0x00008f1149168c1d2fa1eba1ad3e9cd644510000',
          '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc',
          '0x13fff1e'
        ],
      },
    ],
    ['eth_feeHistory'],
    ['eth_gasPrice'],
    ['eth_createAccessList'],
    ['trace_call'],
    ['eth_getTransactionCount'],
  ]);

  await mockServer
    .forPost()
    .withJsonBodyIncluding({
      method: 'debug_traceCall',
     params: [
          {
              "accessList": [],
              "data": "0xef5cfb8c0000000000000000000000000b3e87a076ac4b0d1975f0f232444af6deb96c59",
              "from": "0x4703d823a763c82a6301d391f2d5f7ca2ec3b3dd",
              "gas": "0x1c9c380",
              "maxFeePerGas": "0x61cb4017e",
              "maxPriorityFeePerGas": "0x0",
              "to": "0x00008f1149168c1d2fa1eba1ad3e9cd644510000",
              "type": "0x02"
          },
          "0x13fff1e",
          {
              "stateOverrides": {
                  "0x4703d823a763c82a6301d391f2d5f7ca2ec3b3dd": {
                      "balance": "0xaede8422111b900"
                  }
              },
              "tracer": "callTracer",
              "tracerConfig": {
                  "onlyTopCall": false,
                  "withLog": true
              }
          }
      ],
    })
    .thenCallback(async (req) => {
      return {
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: (await req.body.getJson()).id,
          result: {
            "jsonrpc": "2.0",
            "id": 8685040101606541,
            "error": {
                "code": -32601,
                "message": "The method debug_traceCall does not exist/is not available"
            }
        }
        },
      };
    });

    await mockServer
    .forGet('https://www.4byte.directory/api/v1/signatures/')
    .always()
    .withQuery({ hex_signature: '0xef5cfb8c' })
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        count: 1,
        next: null,
        previous: null,
        "results": [
        {
            "id": 187294,
            "created_at": "2021-05-12T10:20:16.502438Z",
            "text_signature": "claimRewards(address)",
            "hex_signature": "0xef5cfb8c",
            "bytes_signature": "ï\\û"
        }
    ],
      },
    }));
}

describe('PPOM Blockaid Alert - Malicious Contract interaction @no-mmi', function () {
  // eslint-disable-next-line mocha/no-skipped-tests
  it('should show banner alert', async function () {
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
        await driver.clickElement('#maliciousContractInteractionButton');

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
