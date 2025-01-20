const FixtureBuilder = require('../../fixture-builder');
const {
  WINDOW_TITLES,
  defaultGanacheOptions,
  unlockWallet,
  withFixtures,
} = require('../../helpers');
const { mockSecurityAlertsAPIFailed } = require('./utils');
const { mockServerJsonRpc } = require('./mocks/mock-server-json-rpc');

async function mockInfura(mockServer) {
  await mockSecurityAlertsAPIFailed(mockServer);
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
          .withPermissionControllerConnectedToTestDapp({
            useLocalhostHostname: true,
          })
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

        await driver.openNewPage('http://localhost:8080');

        // Click TestDapp button to send JSON-RPC request
        await driver.clickElement('#maliciousTradeOrder');

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

        await driver.clickElement({ text: 'Cancel', tag: 'button' });
        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // switch network to arbitrum
        await driver.clickElement('[data-testid="network-display"]');

        await driver.clickElement({ tag: 'button', text: 'Add' });

        await driver.clickElement({ tag: 'a', text: 'See details' });

        await driver.clickElement({ tag: 'button', text: 'Approve' });

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        // Click TestDapp button to send JSON-RPC request
        await driver.clickElement('#maliciousRawEthButton');

        // Wait for confirmation pop-up
        await driver.waitUntilXWindowHandles(3);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await driver.waitForSelector({
          css: '.mm-text--body-lg-medium',
          text: expectedTitle,
        });

        await driver.waitForSelector({
          css: '.mm-text--body-md',
          text: 'If you approve this request, a third party known for scams will take all your assets.',
        });
      },
    );
  });
});
