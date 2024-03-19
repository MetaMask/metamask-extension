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

async function mockInfuraWithMaliciousResponses(mockServer) {
  await mockInfura(mockServer);
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
          error: {
            message:
              'The method debug_traceCall does not exist/is not available',
          },
        },
      };
    });
}

describe('PPOM Blockaid Alert - Multiple Networks Support @no-mmi', function () {
  // eslint-disable-next-line mocha/no-skipped-tests
  it.skip('should show banner alert after switchinig to another supported network', async function () {
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
        testSpecificMock: mockInfuraWithMaliciousResponses,
        title: this.test.fullTitle(),
      },

      async ({ driver }) => {
        const expectedTitle = 'This is a deceptive request';
        const expectedDescription =
          'If you approve this request, you might lose your assets.';

        await unlockWallet(driver);
        await openDapp(driver);

        // Click TestDapp button to send JSON-RPC request
        await driver.clickElement('#maliciousTradeOrder');

        // Wait for confirmation pop-up
        await driver.waitUntilXWindowHandles(3);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await driver.assertElementNotPresent('.loading-indicator');

        const bannerAlertSelector =
          '[data-testid="security-provider-banner-alert"]';

        let bannerAlertFoundByTitle = await driver.findElement({
          css: bannerAlertSelector,
          text: expectedTitle,
        });
        let bannerAlertText = await bannerAlertFoundByTitle.getText();

        assert(
          bannerAlertFoundByTitle,
          `Banner alert not found. Expected Title: ${expectedTitle} \nExpected reason: approval_farming\n`,
        );
        assert(
          bannerAlertText.includes(expectedDescription),
          `Unexpected banner alert description. Expected: ${expectedDescription} \nExpected reason: approval_farming\n`,
        );

        await driver.clickElement({ text: 'Reject', tag: 'button' });
        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // switch network to arbitrum
        await driver.clickElement('[data-testid="network-display"]');

        await driver.clickElement({ tag: 'button', text: 'Add network' });
        await driver.clickElement({
          tag: 'button',
          text: 'Add',
        });

        await driver.clickElement({ tag: 'a', text: 'View all details' });

        await driver.clickElement({ tag: 'button', text: 'Close' });
        await driver.clickElement({ tag: 'button', text: 'Approve' });
        await driver.clickElement({
          tag: 'h6',
          text: 'Switch to Arbitrum One',
        });

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        // Click TestDapp button to send JSON-RPC request
        await driver.clickElement('#maliciousRawEthButton');

        // Wait for confirmation pop-up
        await driver.waitUntilXWindowHandles(3);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        bannerAlertFoundByTitle = await driver.findElement({
          css: bannerAlertSelector,
          text: expectedTitle,
        });
        bannerAlertText = await bannerAlertFoundByTitle.getText();

        assert(
          bannerAlertFoundByTitle,
          `Banner alert not found. Expected Title: ${expectedTitle} \nExpected reason: raw_native_token_transfer\n`,
        );
        assert(
          bannerAlertText.includes(expectedDescription),
          `Unexpected banner alert description. Expected: ${expectedDescription} \nExpected reason: raw_native_token_transfer\n`,
        );
      },
    );
  });
});
