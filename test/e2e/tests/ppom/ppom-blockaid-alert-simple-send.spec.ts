import { Suite } from 'mocha';
import { MockttpServer } from 'mockttp';
import FixtureBuilder from '../../fixture-builder';
import { withFixtures, WINDOW_TITLES } from '../../helpers';
import { mockMultiNetworkBalancePolling } from '../../mock-balance-polling/mock-balance-polling';
import HomePage from '../../page-objects/pages/home/homepage';
import SendTokenPage from '../../page-objects/pages/send/send-token-page';
import TestDapp from '../../page-objects/pages/test-dapp';
import TransactionConfirmation from '../../page-objects/pages/confirmations/redesign/transaction-confirmation';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';
import { mockServerJsonRpc } from './mocks/mock-server-json-rpc';
import { SECURITY_ALERTS_PROD_API_BASE_URL } from './constants';

const mockMaliciousAddress = '0x5fbdb2315678afecb367f032d93f642f64180aa3';
const mockBenignAddress = '0x50587E46C5B96a3F6f9792922EC647F13E6EFAE4';

const expectedMaliciousTitle = 'This is a deceptive request';
const expectedMaliciousDescription =
  'If you approve this request, a third party known for scams will take all your assets.';

const SEND_REQUEST_BASE_MOCK = {
  method: 'eth_sendTransaction',
  params: [
    {
      from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
      data: '0x',
      to: mockMaliciousAddress,
      value: '0xde0b6b3a7640000',
    },
  ],
};

async function mockInfura(mockServer: MockttpServer): Promise<void> {
  await mockMultiNetworkBalancePolling(mockServer);
  await mockServerJsonRpc(mockServer, [
    ['eth_blockNumber'],
    ['eth_call'],
    ['eth_estimateGas'],
    ['eth_feeHistory'],
    ['eth_gasPrice'],
    ['eth_getBlockByNumber'],
    ['eth_getCode'],
    ['eth_getTransactionCount'],
  ]);
}

async function mockRequest(
  server: MockttpServer,
  request: Record<string, unknown>,
  response: Record<string, unknown>,
): Promise<void> {
  await server
    .forPost(`${SECURITY_ALERTS_PROD_API_BASE_URL}/validate/0x1`)
    .withJsonBodyIncluding(request)
    .thenJson((response.statusCode as number) ?? 201, response);
}

async function mockInfuraWithBenignResponses(
  mockServer: MockttpServer,
): Promise<void> {
  await mockInfura(mockServer);

  await mockRequest(mockServer, SEND_REQUEST_BASE_MOCK, {
    block: 20733513,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    result_type: 'Benign',
    reason: '',
    description: '',
    features: [],
  });
}

async function mockInfuraWithMaliciousResponses(
  mockServer: MockttpServer,
): Promise<void> {
  await mockInfura(mockServer);
  const requestMock = {
    method: 'eth_sendTransaction',
    params: [
      {
        from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
        to: '0x5fbdb2315678afecb367f032d93f642f64180aa3',
        value: '0x9184e72a000',
      },
    ],
  };

  await mockRequest(mockServer, requestMock, {
    block: 20733277,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    result_type: 'Malicious',
    reason: 'transfer_farming',
    description: '',
    features: ['Interaction with a known malicious address'],
  });
}

async function mockInfuraWithFailedResponses(
  mockServer: MockttpServer,
): Promise<void> {
  await mockInfura(mockServer);

  await mockRequest(
    mockServer,
    {
      ...SEND_REQUEST_BASE_MOCK,
      params: [
        {
          from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
          data: '0x',
          to: '0xb8c77482e45f1f44de1745f52c74426c631bdd52',
          value: '0xf43fc2c04ee0000',
        },
      ],
    },
    { statusCode: 500, message: 'Internal server error' },
  );

  // Retained this mock to support fallback to the local PPOM
  await mockServer
    .forGet(
      'https://static.cx.metamask.io/api/v1/confirmations/ppom/ppom_version.json',
    )
    .thenCallback(() => {
      console.log('mocked ppom_version.json');
      return {
        statusCode: 500,
      };
    });
}

/**
 * Tests various Blockaid PPOM security alerts. Some other tests live in separate files due to
 * the need for more sophisticated JSON-RPC mock requests. Some example PPOM Blockaid
 * requests and responses are provided here:
 *
 * @see {@link https://wobbly-nutmeg-8a5.notion.site/MM-E2E-Testing-1e51b617f79240a49cd3271565c6e12d}
 */
describe('Simple Send Security Alert - Blockaid', function (this: Suite) {
  it('should not show security alerts for benign requests', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withPreferencesController({
            securityAlertsEnabled: true,
          })
          .withEnabledNetworks({
            eip155: {
              '0x1': true,
            },
          })
          .build(),
        testSpecificMock: mockInfuraWithBenignResponses,
        title: this.test?.fullTitle(),
      },

      async ({ driver }) => {
        await loginWithoutBalanceValidation(driver);
        const homePage = new HomePage(driver);

        // We validate custom balance as it doesn't come from the local node but it's mocked
        await homePage.checkExpectedBalanceIsDisplayed('20 ETH');
        await homePage.startSendFlow();

        const sendToPage = new SendTokenPage(driver);
        await sendToPage.checkPageIsLoaded();
        await sendToPage.fillRecipient(mockBenignAddress);
        await sendToPage.fillAmount('1');
        await sendToPage.goToNextScreen();

        const transactionConfirmationPage = new TransactionConfirmation(driver);
        await transactionConfirmationPage.checkPageIsLoaded();
        await transactionConfirmationPage.checkNoAlertMessageIsDisplayed();
      },
    );
  });

  /**
   * Disclaimer: This test does not test all reason types. e.g. 'blur_farming',
   * 'malicious_domain'. Some other tests are found in other files:
   * e.g. test/e2e/flask/ppom-blockaid-alert-<name>.spec.js
   */
  it('should show security alerts for malicious requests', async function () {
    await withFixtures(
      // we need to use localhost instead of the ip
      // see issue: https://github.com/MetaMask/MetaMask-planning/issues/3560
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
          .build(),
        testSpecificMock: mockInfuraWithMaliciousResponses,
        title: this.test?.fullTitle(),
      },

      async ({ driver }) => {
        await loginWithoutBalanceValidation(driver);

        // We validate custom balance as it doesn't come from the local node but it's mocked
        await new HomePage(driver).checkExpectedBalanceIsDisplayed('20 ETH');

        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage({ url: 'http://localhost:8080' });
        await testDapp.checkPageIsLoaded();

        await testDapp.clickMaliciousEthTransferButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const confirmation = new TransactionConfirmation(driver);
        await confirmation.checkPageIsLoaded();
        await confirmation.checkAlertMessageIsDisplayed(expectedMaliciousTitle);
        await confirmation.checkAlertMessageIsDisplayed(
          expectedMaliciousDescription,
        );
      },
    );
  });

  it('should show "Be careful" if the PPOM request fails to check transaction', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withPreferencesController({
            securityAlertsEnabled: true,
          })
          .withEnabledNetworks({
            eip155: {
              '0x1': true,
            },
          })
          .build(),
        testSpecificMock: mockInfuraWithFailedResponses,
        title: this.test?.fullTitle(),
      },

      async ({ driver }) => {
        await loginWithoutBalanceValidation(driver);
        const homePage = new HomePage(driver);

        // We validate custom balance as it doesn't come from the local node but it's mocked
        await homePage.checkExpectedBalanceIsDisplayed('20 ETH');
        await homePage.startSendFlow();

        const sendToPage = new SendTokenPage(driver);
        await sendToPage.checkPageIsLoaded();
        await sendToPage.fillRecipient(
          '0xB8c77482e45F1F44dE1745F52C74426C631bDD52',
        );
        await sendToPage.fillAmount('1.1');
        await sendToPage.goToNextScreen();

        const transactionConfirmationPage = new TransactionConfirmation(driver);
        await transactionConfirmationPage.checkPageIsLoaded();

        const expectedTitle = 'Be careful';
        await transactionConfirmationPage.checkAlertMessageIsDisplayed(
          expectedTitle,
        );
      },
    );
  });
});
