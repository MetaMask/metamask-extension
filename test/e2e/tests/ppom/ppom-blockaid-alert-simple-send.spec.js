const { strict: assert } = require('assert');
const FixtureBuilder = require('../../fixture-builder');
const {
  defaultGanacheOptions,
  logInWithBalanceValidation,
  sendScreenToConfirmScreen,
  WINDOW_TITLES,
  withFixtures,
} = require('../../helpers');
const {
  mockMultiNetworkBalancePolling,
} = require('../../mock-balance-polling/mock-balance-polling');
const { mockSecurityAlertsAPIFailed } = require('./utils');
const { mockServerJsonRpc } = require('./mocks/mock-server-json-rpc');

const bannerAlertSelector = '[data-testid="security-provider-banner-alert"]';
const mockMaliciousAddress = '0x5fbdb2315678afecb367f032d93f642f64180aa3';
const mockBenignAddress = '0x50587E46C5B96a3F6f9792922EC647F13E6EFAE4';

const expectedMaliciousTitle = 'This is a deceptive request';
const expectedMaliciousDescription =
  'If you approve this request, a third party known for scams will take all your assets.';

async function mockInfura(mockServer) {
  await mockSecurityAlertsAPIFailed(mockServer);
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

async function mockInfuraWithBenignResponses(mockServer) {
  await mockInfura(mockServer);

  await mockServer
    .forPost()
    .withJsonBodyIncluding({
      method: 'debug_traceCall',
    })
    .thenCallback(async (req) => {
      return {
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: (await req.body.getJson()).id,
          result: {
            type: 'CALL',
            from: '0x0000000000000000000000000000000000000000',
            to: '0xd46e8dd67c5d32be8058bb8eb970870f07244567',
            value: '0xde0b6b3a7640000',
            gas: '0x16c696eb7',
            gasUsed: '0x0',
            input: '0x',
            output: '0x',
          },
        },
      };
    });
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
          result: {
            calls: [
              {
                error: 'execution reverted',
                from: '0x0000000000000000000000000000000000000000',
                gas: '0x1d55c2cb',
                gasUsed: '0x39c',
                input: '0x00000000',
                to: mockMaliciousAddress,
                type: 'DELEGATECALL',
                value: '0x0',
              },
            ],
            error: 'execution reverted',
            from: '0x0000000000000000000000000000000000000000',
            gas: '0x1dcd6500',
            gasUsed: '0x721e',
            input: '0x00000000',
            to: mockMaliciousAddress,
            type: 'CALL',
            value: '0x0',
          },
        },
      };
    });
}

async function mockInfuraWithFailedResponses(mockServer) {
  await mockInfura(mockServer);

  await mockServer
    .forGet(
      'https://static.cx.metamask.io/api/v1/confirmations/ppom/ppom_version.json',
    )
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
