import { Suite } from 'mocha';
import { MockttpServer } from 'mockttp';
import FixtureBuilder from '../../fixture-builder';
import { WINDOW_TITLES, withFixtures } from '../../helpers';
import TestDapp from '../../page-objects/pages/test-dapp';
import TransactionConfirmation from '../../page-objects/pages/confirmations/redesign/transaction-confirmation';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { SECURITY_ALERTS_PROD_API_BASE_URL } from './constants';
import { mockServerJsonRpc } from './mocks/mock-server-json-rpc';

const CONTRACT_ADDRESS = {
  WrappedEther: 'c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  OffchainOracle: '0x52cbe0f49ccdd4dc6e9c13bab024eabd2842045b',
  TetherToken: 'dac17f958d2ee523a2206206994597c13d831ec7',
};

async function mockInfura(mockServer: MockttpServer): Promise<void> {
  await mockServerJsonRpc(mockServer, [
    ['eth_blockNumber'],
    [
      'eth_call',
      {
        params: [
          {
            accessList: [],
            data: '0x06fdde03',
            to: CONTRACT_ADDRESS.WrappedEther,
            type: '0x02',
          },
        ],
      },
    ],
    [
      'eth_call',
      {
        methodResultVariant: 'symbol',
        params: [
          {
            accessList: [],
            data: '0x95d89b41',
            to: CONTRACT_ADDRESS.WrappedEther,
            type: '0x02',
          },
          '0x11a7e9a',
        ],
      },
    ],
    [
      'eth_call',
      {
        methodResultVariant: 'decimals',
        params: [
          {
            accessList: [],
            data: '0x313ce567',
            to: CONTRACT_ADDRESS.WrappedEther,
            type: '0x02',
          },
          '0x11a7e9a',
        ],
      },
    ],
    [
      'eth_call',
      {
        methodResultVariant: 'getRateWithThreshold',
        params: [
          {
            accessList: [],
            data: `0x6744d6c7000000000000000000000000${CONTRACT_ADDRESS.WrappedEther}000000000000000000000000${CONTRACT_ADDRESS.TetherToken}00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000063`,
            to: CONTRACT_ADDRESS.OffchainOracle,
            type: '0x02',
          },
          '0x11a7e9a',
        ],
      },
    ],
    ['eth_estimateGas'],
    ['eth_feeHistory'],
    ['eth_gasPrice'],
    ['eth_getBalance'],
    ['eth_getBlockByNumber'],
    ['eth_getCode'],
    ['eth_getTransactionCount'],
  ]);
  mockSecurityAlertsRequest(mockServer);
}

async function mockSecurityAlertsRequest(server: MockttpServer): Promise<void> {
  const request = {
    method: 'eth_signTypedData_v4',
    params: ['0x5cfe73b6021e818b776b421b1c4db2474086a7e1'],
  };

  const response = {
    statusCode: 201,
    body: {
      block: 20733277,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      result_type: 'Malicious',
      reason: 'transfer_farming',
      description: '',
      features: ['Interaction with a known malicious address'],
    },
  };

  await server
    .forPost(`${SECURITY_ALERTS_PROD_API_BASE_URL}/validate/0x1`)
    .withJsonBodyIncluding(request)
    .thenJson(response.statusCode ?? 201, response);
}

describe('PPOM Blockaid Alert - Set Trade farming order', function (this: Suite) {
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
        testSpecificMock: mockInfura,
        title: this.test?.fullTitle(),
      },

      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage({ url: 'http://localhost:8080' });
        await testDapp.checkPageIsLoaded();

        const expectedTitle = 'This is a deceptive request';
        const expectedDescription =
          'If you approve this request, you might lose your assets.';

        // Click TestDapp button to send JSON-RPC request
        await testDapp.clickMaliciousTradeOrderButton();

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
