const { strict: assert } = require('assert');
const FixtureBuilder = require('../fixture-builder');
const { mockServerJsonRpc } = require('../mock-server-json-rpc');

const {
  WINDOW_TITLES,
  defaultGanacheOptions,
  openDapp,
  unlockWallet,
  withFixtures,
} = require('../helpers');

const bannerAlertSelector = '[data-testid="security-provider-banner-alert"]';

const selectedAddress = '0x5cfe73b6021e818b776b421b1c4db2474086a7e1';
const selectedAddressWithoutPrefix = '5cfe73b6021e818b776b421b1c4db2474086a7e1';

const CONTRACT_ADDRESS = {
  BalanceChecker: '0xb1f8e55c7f64d203c1400b9d8555d050f94adf39',
  BAYC: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
  ENSRegistryWithFallback: '0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e',
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
        methodResultVariant: 'ensRegistryWithFallback',
        params: [{ to: CONTRACT_ADDRESS.ENSRegistryWithFallback }],
      },
    ],
    [
      'eth_call',
      {
        methodResultVariant: 'balance',
        params: [
          {
            accessList: [],
            data: `0x70a0823100000000000000000000000000000000000000000000000000000000${selectedAddressWithoutPrefix}`,
            to: CONTRACT_ADDRESS.BAYC,
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
        methodResultVariant: 'BAYC',
        params: [CONTRACT_ADDRESS.BAYC],
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
    .thenCallback((req) => {
      return {
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: req.body.json.id,
          result: {
            error: 'execution reverted',
            from: '0x0000000000000000000000000000000000000000',
            gas: '0x1dcd6500',
            gasUsed: '0x52ef',
            input: '0x00000000',
            to: CONTRACT_ADDRESS.BAYC,
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
          data: '0xa22cb465000000000000000000000000b85492afc686d5ca405e3cd4f50b05d358c75ede0000000000000000000000000000000000000000000000000000000000000001',
        },
      ],
    })
    .thenCallback((req) => {
      return {
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: req.body.json.id,
          result: {
            from: selectedAddress,
            gas: '0x19ce5cb',
            gasUsed: '0xb4c8',
            input:
              '0xa22cb465000000000000000000000000b85492afc686d5ca405e3cd4f50b05d358c75ede0000000000000000000000000000000000000000000000000000000000000001',
            logs: [
              {
                address: CONTRACT_ADDRESS.BAYC,
                data: '0x0000000000000000000000000000000000000000000000000000000000000001',
                topics: [
                  '0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31',
                  `0x000000000000000000000000${selectedAddressWithoutPrefix}`,
                  '0x000000000000000000000000b85492afc686d5ca405e3cd4f50b05d358c75ede',
                ],
              },
            ],
            to: CONTRACT_ADDRESS.BAYC,
            type: 'CALL',
            value: '0x0',
          },
        },
      };
    });
}

describe('PPOM Blockaid Alert - Set Approval to All @no-mmi', function () {
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
        title: this.test.title,
      },

      async ({ driver }) => {
        await driver.navigate();
        await unlockWallet(driver);
        await openDapp(driver);

        const expectedTitle = 'This is a deceptive request';
        const expectedDescription =
          'If you approve this request, a third party known for scams might take all your assets.';

        // Click TestDapp button to send JSON-RPC request
        await driver.clickElement('#maliciousSetApprovalForAll');

        // Wait for confirmation pop-up
        await driver.waitUntilXWindowHandles(3);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Notification);

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
