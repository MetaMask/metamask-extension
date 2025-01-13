import { MockttpServer } from 'mockttp';
import FixtureBuilder from '../../../fixture-builder';

import {
  defaultGanacheOptions,
  withFixtures,
  logInWithBalanceValidation,
} from '../../../helpers';
import { mockServerJsonRpc } from '../mocks/mock-server-json-rpc';
import { mockMultiNetworkBalancePolling } from '../../../mock-balance-polling/mock-balance-polling';
import { loginWithBalanceValidation } from '../../../page-objects/flows/login.flow';
import { createTransactionToAddress } from '../../../page-objects/flows/transaction';
import Confirmation from '../../../page-objects/pages/confirmations/redesign/confirmation';
import { mockSecurityAlertValidateRequest } from './utils';

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
      value: '0x0',
    },
  ],
};

const SEND_REQUEST_MALICIOUS_MOCK = {
  ...SEND_REQUEST_BASE_MOCK,
  params: [
    {
      ...SEND_REQUEST_BASE_MOCK.params[0],
      value: '0xf43fc2c04ee0000',
    },
  ],
};

async function mockInfura(mockServer: MockttpServer): Promise<void> {
  await mockMultiNetworkBalancePolling(mockServer);
  await mockServerJsonRpc(mockServer, [['eth_getBalance']]);
}

async function mockBenignResponses(mockServer: MockttpServer): Promise<void> {
  await mockSecurityAlertValidateRequest(mockServer, SEND_REQUEST_BASE_MOCK, {
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
  await mockInfura(mockServer);
  await mockSecurityAlertValidateRequest(
    mockServer,
    SEND_REQUEST_MALICIOUS_MOCK,
    {
      block: 20733277,
      result_type: 'Malicious',
      reason: 'transfer_farming',
      description: '',
      features: ['Interaction with a known malicious address'],
    },
  );
}

async function mockInfuraWithFailedResponses(
  mockServer: MockttpServer,
): Promise<void> {
  await mockInfura(mockServer);

  await mockSecurityAlertValidateRequest(
    mockServer,
    {
      ...SEND_REQUEST_BASE_MOCK,
      params: [
        {
          ...SEND_REQUEST_BASE_MOCK.params[0],
          value: '0x16345785d8a0000',
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
        const confirmation = new Confirmation(driver);
        await loginWithBalanceValidation(driver);

        await createTransactionToAddress({
          driver,
          recipientAddress: mockBenignAddress,
          amount: '0',
        });

        await confirmation.checkLoadingSpinner();

        await confirmation.checkBannerAlertIsNotPresent();
      },
    );
  });

  it('should show security alerts banner for malicious requests', async function () {
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
        testSpecificMock: mockMaliciousResponses,
        title: this.test?.fullTitle(),
      },

      async ({ driver }) => {
        const confirmation = new Confirmation(driver);
        await loginWithBalanceValidation(driver);

        await createTransactionToAddress({
          driver,
          recipientAddress: mockMaliciousAddress,
          amount: '1.1',
        });

        await confirmation.checkLoadingSpinner();

        await confirmation.validateBannerAlert({
          expectedTitle: expectedMaliciousTitle,
          expectedDescription: expectedMaliciousDescription,
        });
      },
    );
  });

  it('should show "Be careful" if the Security Alerts API fails to check transaction', async function () {
    const expectedTitle = 'Be careful';
    const expectedDescription =
      "Because of an error, we couldn't check for security alerts. Only continue if you trust every address involved";

    await withFixtures(
      {
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
        const confirmation = new Confirmation(driver);
        await logInWithBalanceValidation(driver);

        await createTransactionToAddress({
          driver,
          recipientAddress: mockMaliciousAddress,
          amount: '0.1',
        });

        await confirmation.checkLoadingSpinner();

        await confirmation.validateBannerAlert({
          expectedTitle,
          expectedDescription,
        });
      },
    );
  });
});
