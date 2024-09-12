const { strict: assert } = require('assert');
const FixtureBuilder = require('../../fixture-builder');

const {
  defaultGanacheOptions,
  withFixtures,
  sendScreenToConfirmScreen,
  logInWithBalanceValidation,
} = require('../../helpers');
const { mockServerJsonRpc } = require('./mocks/mock-server-json-rpc');

const bannerAlertSelector = '[data-testid="security-provider-banner-alert"]';
const mockMaliciousAddress = '0x5fbdb2315678afecb367f032d93f642f64180aa3';
const mockBenignAddress = '0x50587E46C5B96a3F6f9792922EC647F13E6EFAE4';

const expectedMaliciousTitle = 'This is a deceptive request';
const expectedMaliciousDescription =
  'If you approve this request, a third party known for scams will take all your assets.';

const SECURITY_ALERTS_API_URL =
  'https://security-alerts.dev-api.cx.metamask.io';

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

async function mockRequest(server, request, response) {
  await server
    .forPost(`${SECURITY_ALERTS_API_URL}/validate/0x1`)
    .withJsonBodyIncluding(request)
    .thenJson(201, response);
}

async function mockInfuraWithBenignResponses(mockServer) {
  await mockInfura(mockServer);

  await mockRequest(
    mockServer,
    {
      method: 'eth_sendTransaction',
      params: [
        {
          from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
          data: '0x',
          to: '0x5fbdb2315678afecb367f032d93f642f64180aa3',
          value: '0xde0b6b3a7640000',
        },
      ],
    },
    {
      block: 20733513,
      result_type: 'Benign',
      reason: '',
      description: '',
      features: [],
    },
  );
}

async function mockInfuraWithMaliciousResponses(mockServer) {
  await mockInfura(mockServer);

  await mockRequest(
    mockServer,
    {
      method: 'eth_sendTransaction',
      params: [
        {
          from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
          data: '0x',
          to: '0x5fbdb2315678afecb367f032d93f642f64180aa3',
          value: '0xde0b6b3a7640000',
        },
      ],
    },
    {
      block: 20733277,
      result_type: 'Malicious',
      reason: 'transfer_farming',
      description: '',
      features: ['Interaction with a known malicious address'],
    },
  );
}

async function mockInfuraWithFailedResponses(mockServer) {
  await mockInfura(mockServer);

  await mockServer
    .forPost()
    .withJsonBodyIncluding({
      method: 'debug_traceCall',
      params: [{ accessList: [], data: '0x00000000' }],
    })
    .thenCallback(() => {
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
  it.only('should not show security alerts for benign requests', async function () {
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
        // await driver.delay(100000)
        const isPresent = await driver.isElementPresent(bannerAlertSelector);
        assert.equal(true, false, `Banner alert unexpectedly found.`);
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
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
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

        await sendScreenToConfirmScreen(driver, mockMaliciousAddress, '1');

        // Find element by title
        const bannerAlertFoundByTitle = await driver.findElement({
          css: bannerAlertSelector,
          text: expectedMaliciousTitle,
        });
        const bannerAlertText = await bannerAlertFoundByTitle.getText();

        assert(
          bannerAlertFoundByTitle,
          `Banner alert not found. Expected Title: ${expectedMaliciousTitle}`,
        );
        assert(
          bannerAlertText.includes(expectedMaliciousDescription),
          `Unexpected banner alert description. Expected: ${expectedMaliciousDescription}`,
        );
      },
    );
  });

  // eslint-disable-next-line mocha/no-skipped-tests
  it.skip('should show "Request may not be safe" if the PPOM request fails to check transaction', async function () {
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
        // await driver.delay(100000)
        const expectedTitle = 'Request may not be safe';

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
