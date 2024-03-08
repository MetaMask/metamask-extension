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
    .thenCallback(async (req) => {
      return {
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: (await req.body.getJson()).id,
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
      method: 'eth_call',
      params: [
        {
          data: '0x0178b8bfdae332162d22107623083e6e5828680f44a51ee4fe7b05210f01785df2e81d6d',
          to: CONTRACT_ADDRESS.ENSRegistryWithFallback,
        },
      ],
    })
    .thenCallback(async (req) => {
      return {
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: (await req.body.getJson()).id,
          result:
            '0x0000000000000000000000000000000000000000000000000000000000000000',
        },
      };
    });

  await mockServer
    .forPost()
    .withJsonBodyIncluding({
      method: 'eth_call',
      params: [
        {
          data: '0x01ffc9a780ac58cd00000000000000000000000000000000000000000000000000000000',
          to: CONTRACT_ADDRESS.BAYC,
        },
      ],
    })
    .thenCallback(async (req) => {
      return {
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: (await req.body.getJson()).id,
          result:
            '0x0000000000000000000000000000000000000000000000000000000000000001',
        },
      };
    });

  // 1
  await mockServer
    .forPost()
    .withJsonBodyIncluding({
      method: 'eth_call',
      params: [
        {
          data: `0xf0002ea9000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000002000000000000000000000000${selectedAddressWithoutPrefix}0000000000000000000000002990079bcdee240329a520d2444386fc119da21a00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000`,
          to: CONTRACT_ADDRESS.BalanceChecker,
        },
      ],
    })
    .thenCallback(async (req) => {
      return {
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: (await req.body.getJson()).id,
          result:
            '0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000b6a704f0f7fd6ad',
        },
      };
    });

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
            from: '0x0000000000000000000000000000000000000000',
            gas: '0x1dcd6500',
            gasUsed: '0x5218',
            input: '0x00000000',
            to: '0xb85492afc686d5ca405e3cd4f50b05d358c75ede',
            type: 'CALL',
            value: '0x0',
          },
        },
      };
    });

  await mockServer
    .forPost()
    .withJsonBodyIncluding({
      method: 'eth_call',
      params: [{ data: '0x06fdde03', to: CONTRACT_ADDRESS.BAYC }],
    })
    .thenCallback(async (req) => {
      return {
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: (await req.body.getJson()).id,
          result:
            '0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000011426f7265644170655961636874436c7562000000000000000000000000000000',
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
    .thenCallback(async (req) => {
      return {
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: (await req.body.getJson()).id,
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
        title: this.test.title,
      },

      async ({ driver }) => {
        await unlockWallet(driver);
        await openDapp(driver);

        const expectedTitle = 'This is a deceptive request';
        const expectedDescription =
          'If you approve this request, you might lose your assets.';

        // Click TestDapp button to send JSON-RPC request
        await driver.clickElement('#maliciousSetApprovalForAll');

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
