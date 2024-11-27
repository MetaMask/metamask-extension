import { MockttpServer } from 'mockttp';
import FixtureBuilder from '../../../fixture-builder';

import {
  defaultGanacheOptions,
  withFixtures,
  sendScreenToConfirmScreen,
  logInWithBalanceValidation,
  WINDOW_TITLES,
} from '../../../helpers';
import { SECURITY_ALERTS_PROD_API_BASE_URL } from '../constants';
import { mockServerJsonRpc } from '../mocks/mock-server-json-rpc';
import { mockMultiNetworkBalancePolling } from '../../../mock-balance-polling/mock-balance-polling';

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

async function mockInfura(mockServer: MockttpServer): Promise<void> {
  await mockMultiNetworkBalancePolling(mockServer);
  await mockServerJsonRpc(mockServer, [['eth_getBalance']]);
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

async function mockBenignResponses(mockServer: MockttpServer): Promise<void> {
  await mockRequest(mockServer, SEND_REQUEST_BASE_MOCK, {
    block: 20733513,
    result_type: 'Benign',
    reason: '',
    description: '',
    features: [],
  });
}

async function mockMaliciousResponses(
  mockServer: MockttpServer,
): Promise<void> {
  await mockRequest(mockServer, SEND_REQUEST_BASE_MOCK, {
    block: 20733277,
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

describe('Security Alerts API - Simple Send @no-mmi', function () {
  it('should not show security alerts banner for benign requests', async function () {
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
        testSpecificMock: mockBenignResponses,
        title: this.test?.fullTitle(),
      },

      async ({ driver }) => {
        await logInWithBalanceValidation(driver);

        await sendScreenToConfirmScreen(driver, mockBenignAddress, '0');

        await driver.assertElementNotPresent('.loading-indicator');

        await driver.assertElementNotPresent(bannerAlertSelector);
      },
    );
  });

  it('should show security alerts banner for malicious requests', async function () {
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
        testSpecificMock: mockMaliciousResponses,
        title: this.test?.fullTitle(),
      },

      async ({ driver }) => {
        await logInWithBalanceValidation(driver);

        await driver.openNewPage('http://localhost:8080');

        await driver.clickElement('#maliciousRawEthButton');
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await driver.assertElementNotPresent('.loading-indicator');

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

  it('should show "Be careful" if the Security Alerts API fails to check transaction', async function () {
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
        title: this.test?.fullTitle(),
      },

      async ({ driver }) => {
        await logInWithBalanceValidation(driver);

        await sendScreenToConfirmScreen(
          driver,
          '0xB8c77482e45F1F44dE1745F52C74426C631bDD52',
          '1.1',
        );

        await driver.assertElementNotPresent('.loading-indicator');

        await driver.waitForSelector({
          css: '.mm-text--body-lg-medium',
          text: 'Be careful',
        });

        await driver.waitForSelector({
          css: '.mm-text--body-md',
          text: `Because of an error, we couldn't check for security alerts. Only continue if you trust every address involved`,
        });
      },
    );
  });
});
