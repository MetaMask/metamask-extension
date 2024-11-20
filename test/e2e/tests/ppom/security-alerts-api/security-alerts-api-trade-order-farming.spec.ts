import { MockttpServer } from 'mockttp';
import { SECURITY_ALERTS_PROD_API_BASE_URL } from '../constants';
import FixtureBuilder from '../../../fixture-builder';
import {
  WINDOW_TITLES,
  defaultGanacheOptions,
  unlockWallet,
  withFixtures,
} from '../../../helpers';
import { SecurityAlertResponse } from '../../../../../app/scripts/lib/ppom/types';

const maliciousTradeAlert: SecurityAlertResponse = {
  block: 1,
  result_type: 'Malicious',
  reason: 'trade_order_farming',
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
    })
    .thenJson(201, response);
}

async function mockMaliciousResponses(
  mockServer: MockttpServer,
): Promise<void> {
  await mockRequest(mockServer, maliciousTradeAlert);
}

describe('Security Alerts API - Set Trade farming order @no-mmi', function () {
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
        testSpecificMock: mockMaliciousResponses,
        title: this?.test?.title,
      },

      async ({ driver }) => {
        await unlockWallet(driver);
        await driver.openNewPage('http://localhost:8080');

        const expectedTitle = 'This is a deceptive request';
        const expectedDescription =
          'If you approve this request, you might lose your assets.';

        await driver.clickElement('#maliciousTradeOrder');
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
