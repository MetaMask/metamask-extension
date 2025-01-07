import { MockttpServer } from 'mockttp';
import { SECURITY_ALERTS_PROD_API_BASE_URL } from '../constants';
import FixtureBuilder from '../../../fixture-builder';
import { defaultGanacheOptions, withFixtures } from '../../../helpers';
import { SecurityAlertResponse } from '../../../../../app/scripts/lib/ppom/types';
import Confirmation from '../../../page-objects/pages/confirmations/redesign/confirmation';
import {
  initializePages,
  openDappAndTriggerSignature,
  SignatureType,
} from '../../confirmations/signatures/signature-helpers';

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
      method: 'eth_signTypedData_v4',
      params: ['0x5cfe73b6021e818b776b421b1c4db2474086a7e1'],
    })
    .thenJson(201, response);
}

async function mockMaliciousResponses(
  mockServer: MockttpServer,
): Promise<void> {
  await mockRequest(mockServer, maliciousTradeAlert);
}
describe('Security Alerts API - Signatures @no-mmi', function () {
  describe('Set Trade farming order', function () {
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
          title: this?.test?.title,
        },

        async ({ driver }) => {
          await initializePages(driver);
          const confirmation = new Confirmation(driver);

          const expectedTitle = 'This is a deceptive request';
          const expectedDescription =
            'If you approve this request, you might lose your assets.';

          await openDappAndTriggerSignature(
            driver,
            SignatureType.MaliciousTradeOrder,
          );

          await confirmation.checkLoadingSpinner();

          await confirmation.validateBannerAlert({
            expectedTitle,
            expectedDescription,
          });
        },
      );
    });
  });
});
