import { MockttpServer } from 'mockttp';
import { SECURITY_ALERTS_PROD_API_BASE_URL } from '../constants';

import FixtureBuilder from '../../../fixture-builder';

import {
  WINDOW_TITLES,
  defaultGanacheOptions,
  openDapp,
  unlockWallet,
  withFixtures,
} from '../../../helpers';
import { SecurityAlertResponse } from '../../../../../app/scripts/lib/ppom/types';

const SELECTED_ADDRESS = '0x5cfe73b6021e818b776b421b1c4db2474086a7e1';

const CONTRACT_ADDRESS = {
  BalanceChecker: '0xb1f8e55c7f64d203c1400b9d8555d050f94adf39',
  BUSD: '0x4fabb145d64652a948d72533023f6e7a623c7c53',
  BUSDImplementation: '0x2a3f1a37c04f82aa274f5353834b2d002db91015',
  OffChainOracle: '0x52cbe0f49ccdd4dc6e9c13bab024eabd2842045b',
} as const;

const maliciousApprovalAlert: SecurityAlertResponse = {
  block: 1,
  result_type: 'Malicious',
  reason: 'approval_farming',
  description: 'If you approve this request, you might lose your assets.',
  features: [],
};

async function mockRequest(
  server: MockttpServer,
  response: SecurityAlertResponse,
): Promise<void> {
  await server
    .forPost(`${SECURITY_ALERTS_PROD_API_BASE_URL}/validate/0x1`)
    .withJsonBodyIncluding({
      method: 'eth_sendTransaction',
      params: [
        {
          from: SELECTED_ADDRESS,
          data: '0x095ea7b3000000000000000000000000e50a2dbc466d01a34c3e8b7e8e45fce4f7da39e6000000000000000000000000000000000000000000000000ffffffffffffffff',
          to: CONTRACT_ADDRESS.BUSD,
        },
      ],
    })
    .thenJson(201, response);
}

async function mockMaliciousResponses(
  mockServer: MockttpServer,
): Promise<void> {
  await mockRequest(mockServer, maliciousApprovalAlert);
}

describe('Security Alerts API - Malicious ERC20 Approval @no-mmi', function () {
  it('should show banner alert', async function () {
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
        title: this?.test?.fullTitle(),
      },

      async ({ driver }) => {
        await unlockWallet(driver);
        await openDapp(driver);

        const expectedTitle = 'This is a deceptive request';
        const expectedDescription =
          'If you approve this request, a third party known for scams might take all your assets.';

        await driver.clickElement('#maliciousApprovalButton');

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
