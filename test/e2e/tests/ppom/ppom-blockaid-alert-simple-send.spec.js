const { strict: assert } = require('assert');
const FixtureBuilder = require('../../fixture-builder');
const {
  defaultGanacheOptions,
  withFixtures,
  sendScreenToConfirmScreen,
  logInWithBalanceValidation,
  WINDOW_TITLES,
  tempToggleSettingRedesignedTransactionConfirmations,
} = require('../../helpers');
const {
  mockMultiNetworkBalancePolling,
} = require('../../mock-balance-polling/mock-balance-polling');
const { SECURITY_ALERTS_PROD_API_BASE_URL } = require('./constants');
const { mockServerJsonRpc } = require('./mocks/mock-server-json-rpc');

const bannerAlertSelector = '[data-testid="security-provider-banner-alert"]';
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

async function mockInfura(mockServer) {
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

async function mockRequest(server, request, response) {
  await server
    .forPost(`${SECURITY_ALERTS_PROD_API_BASE_URL}/validate/0x1`)
    .withJsonBodyIncluding(request)
    .thenJson(response.statusCode ?? 201, response);
}

async function mockInfuraWithBenignResponses(mockServer) {
  await mockInfura(mockServer);

  await mockRequest(mockServer, SEND_REQUEST_BASE_MOCK, {
    block: 20733513,
    result_type: 'Benign',
    reason: '',
    description: '',
    features: [],
  });
}

async function mockInfuraWithMaliciousResponses(mockServer) {
  await mockInfura(mockServer);

  await mockRequest(mockServer, SEND_REQUEST_BASE_MOCK, {
    block: 20733277,
    result_type: 'Malicious',
    reason: 'transfer_farming',
    description: '',
    features: ['Interaction with a known malicious address'],
  });
}

async function mockInfuraWithFailedResponses(mockServer) {
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
describe('Simple Send Security Alert - Blockaid @no-mmi', function () {
  describe('Old confirmation screens', function () {
    it('should show "Be careful" if the PPOM request fails to check transaction', async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withNetworkControllerOnMainnet()
            .withPreferencesController({
              securityAlertsEnabled: true,
            })
            .build(),
          defaultGanacheOptions,
          testSpecificMock: mockInfuraWithFailedResponses,
          title: this.test.fullTitle(),
        },

        async ({ driver }) => {
          await logInWithBalanceValidation(driver);

          await tempToggleSettingRedesignedTransactionConfirmations(driver);

          await sendScreenToConfirmScreen(
            driver,
            '0xB8c77482e45F1F44dE1745F52C74426C631bDD52',
            '1.1',
          );
          const expectedTitle = 'Be careful';

          const bannerAlert = await driver.findElement({
            css: bannerAlertSelector,
            text: expectedTitle,
          });

          assert(
            bannerAlert,
            `Banner alert not found. Expected Title: ${expectedTitle}`,
          );
        },
      );
    });
  });

  describe('Redesigned confirmation screens', function () {
    it('should not show security alerts for benign requests', async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withNetworkControllerOnMainnet()
            .withPreferencesController({
              securityAlertsEnabled: true,
            })
            .build(),
          defaultGanacheOptions,
          testSpecificMock: mockInfuraWithBenignResponses,
          title: this.test.fullTitle(),
        },

        async ({ driver }) => {
          await logInWithBalanceValidation(driver);

          await sendScreenToConfirmScreen(driver, mockBenignAddress, '1');

          const isPresent = await driver.isElementPresent(bannerAlertSelector);
          assert.equal(isPresent, false, `Banner alert unexpectedly found.`);
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
            .build(),
          defaultGanacheOptions,
          testSpecificMock: mockInfuraWithMaliciousResponses,
          title: this.test.fullTitle(),
        },

        async ({ driver }) => {
          await logInWithBalanceValidation(driver);

          await driver.openNewPage('http://localhost:8080');

          await driver.clickElement('#maliciousRawEthButton');
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

          await driver.waitForSelector({
            css: '.mm-text--body-lg-medium',
            text: expectedMaliciousTitle,
          });

          await driver.waitForSelector({
            css: '.mm-text--body-md',
            text: expectedMaliciousDescription,
          });
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
            .build(),
          defaultGanacheOptions,
          testSpecificMock: mockInfuraWithFailedResponses,
          title: this.test.fullTitle(),
        },

        async ({ driver }) => {
          await logInWithBalanceValidation(driver);

          await sendScreenToConfirmScreen(
            driver,
            '0xB8c77482e45F1F44dE1745F52C74426C631bDD52',
            '1.1',
          );
          const expectedTitle = 'Be careful';

          const bannerAlert = await driver.findElement({
            css: '[data-testid="confirm-banner-alert"]',
            text: expectedTitle,
          });

          assert(
            bannerAlert,
            `Banner alert not found. Expected Title: ${expectedTitle}`,
          );
        },
      );
    });
  });
});
