import { Suite } from 'mocha';
import { MockttpServer } from 'mockttp';
import FixtureBuilder from '../../fixture-builder';
import { WINDOW_TITLES, withFixtures } from '../../helpers';
import TestDapp from '../../page-objects/pages/test-dapp';
import TransactionConfirmation from '../../page-objects/pages/confirmations/redesign/transaction-confirmation';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';
import { mockServerJsonRpc } from './mocks/mock-server-json-rpc';
import { SECURITY_ALERTS_PROD_API_BASE_URL } from './constants';

type SecurityAlert = {
  block: number;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  result_type: string;
  reason: string;
  description: string;
  features: string[];
};

const SELECTED_ADDRESS = '0x5cfe73b6021e818b776b421b1c4db2474086a7e1';

const CONTRACT_ADDRESS_USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';

async function mockInfura(mockServer: MockttpServer): Promise<void> {
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
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  result_type: 'Malicious',
  reason: 'transfer_farming',
  description:
    'Transfer to 0x5fbdb2315678afecb367f032d93f642f64180aa3, classification: A known malicious address is involved in the transaction',
  features: ['A known malicious address is involved in the transaction'],
};

async function mockRequest(
  server: MockttpServer,
  response: SecurityAlert,
): Promise<void> {
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

async function mockInfuraWithMaliciousResponses(
  mockServer: MockttpServer,
): Promise<void> {
  await mockInfura(mockServer);

  await mockRequest(mockServer, maliciousTransferAlert);
}

describe('PPOM Blockaid Alert - Malicious ERC20 Transfer', function (this: Suite) {
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
          .withEnabledNetworks({
            eip155: {
              '0x1': true,
            },
          })
          .withNetworkControllerOnMainnet()
          .build(),
        testSpecificMock: mockInfuraWithMaliciousResponses,
        title: this.test?.fullTitle(),
      },

      async ({ driver }) => {
        await loginWithoutBalanceValidation(driver);

        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage({ url: 'http://localhost:8080' });
        await testDapp.checkPageIsLoaded();

        const expectedTitle = 'This is a deceptive request';
        const expectedDescription =
          'If you approve this request, a third party known for scams will take all your assets.';

        // Click TestDapp button to send JSON-RPC request
        await testDapp.clickMaliciousERC20TransferButton();

        // Wait for confirmation pop-up
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const confirmation = new TransactionConfirmation(driver);
        await confirmation.checkPageIsLoaded();
        await confirmation.checkAlertMessageIsDisplayed(expectedTitle);
        await confirmation.checkAlertMessageIsDisplayed(expectedDescription);
      },
    );
  });
});
