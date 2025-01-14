const FixtureBuilder = require('../../fixture-builder');

const {
  WINDOW_TITLES,
  defaultGanacheOptions,
  unlockWallet,
  withFixtures,
} = require('../../helpers');
const { SECURITY_ALERTS_PROD_API_BASE_URL } = require('./constants');
const { mockServerJsonRpc } = require('./mocks/mock-server-json-rpc');

const SELECTED_ADDRESS = '0x5cfe73b6021e818b776b421b1c4db2474086a7e1';

const CONTRACT_ADDRESS_USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';

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

const maliciousTransferAlert = {
  block: 1,
  result_type: 'Malicious',
  reason: 'transfer_farming',
  description:
    'Transfer to 0x5fbdb2315678afecb367f032d93f642f64180aa3, classification: A known malicious address is involved in the transaction',
  features: ['A known malicious address is involved in the transaction'],
};

async function mockRequest(server, response) {
  await server
    .forPost(`${SECURITY_ALERTS_PROD_API_BASE_URL}/validate/0x1`)
    .withJsonBodyIncluding({
      method: 'eth_sendTransaction',
      params: [
        {
          from: SELECTED_ADDRESS,
          data: '0xa9059cbb0000000000000000000000005fbdb2315678afecb367f032d93f642f64180aa30000000000000000000000000000000000000000000000000000000000000064',
          to: CONTRACT_ADDRESS_USDC,
          value: '0x0',
        },
      ],
    })
    .thenJson(201, response);
}

async function mockInfuraWithMaliciousResponses(mockServer) {
  await mockInfura(mockServer);

  await mockRequest(mockServer, maliciousTransferAlert);
}

describe('PPOM Blockaid Alert - Malicious ERC20 Transfer @no-mmi', function () {
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
        testSpecificMock: mockInfuraWithMaliciousResponses,
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
