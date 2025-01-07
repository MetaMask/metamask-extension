import { MockttpServer } from 'mockttp';
import { SECURITY_ALERTS_PROD_API_BASE_URL } from '../constants';

import FixtureBuilder from '../../../fixture-builder';

import { defaultGanacheOptions, withFixtures } from '../../../helpers';
import { SecurityAlertResponse } from '../../../../../app/scripts/lib/ppom/types';
import {
  initializePages,
  openDappAndClickButton,
  openDappAndTriggerSignature,
  SignatureType,
} from '../../confirmations/signatures/signature-helpers';
import Confirmation from '../../../page-objects/pages/confirmations/redesign/confirmation';

const SELECTED_ADDRESS = '0x5cfe73b6021e818b776b421b1c4db2474086a7e1';

const CONTRACT_ADDRESS = {
  BalanceChecker: '0xb1f8e55c7f64d203c1400b9d8555d050f94adf39',
  BUSD: '0x4fabb145d64652a948d72533023f6e7a623c7c53',
  BUSDImplementation: '0x2a3f1a37c04f82aa274f5353834b2d002db91015',
  OffChainOracle: '0x52cbe0f49ccdd4dc6e9c13bab024eabd2842045b',
  BAYC: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
  ENSRegistryWithFallback: '0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e',
  USDC: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
} as const;

const preferencesOptions = {
  securityAlertsEnabled: true,
  preferences: {
    redesignedTransactionsEnabled: true,
    redesignedConfirmationsEnabled: true,
    isRedesignedConfirmationsDeveloperEnabled: true,
  },
};

const expectedTitle = 'This is a deceptive request';

describe('Security Alerts API - Contract Interaction @no-mmi', function () {
  describe('Malicious Contract interaction', function () {
    const maliciousTransferAlert: SecurityAlertResponse = {
      block: 1,
      result_type: 'Malicious',
      reason: 'raw_native_token_transfer',
      description:
        'Interaction with a known malicious address: 0x00008f1149168c1d2fa1eba1ad3e9cd644510000',
      features: ['Interaction with a known malicious address'],
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
              data: '0xef5cfb8c0000000000000000000000000b3e87a076ac4b0d1975f0f232444af6deb96c59',
              to: '0x00008f1149168c1d2fa1eba1ad3e9cd644510000',
              value: '0x0',
            },
          ],
        })
        .thenJson(201, response);
    }

    async function mockMaliciousResponses(mockServer: MockttpServer) {
      await mockRequest(mockServer, maliciousTransferAlert);
    }
    it('should show banner alert', async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withNetworkControllerOnMainnet()
            .withPermissionControllerConnectedToTestDapp()
            .withPreferencesController(preferencesOptions)
            .build(),
          defaultGanacheOptions,
          testSpecificMock: mockMaliciousResponses,
          title: this?.test?.fullTitle(),
        },

        async ({ driver }) => {
          await initializePages(driver);
          const confirmation = new Confirmation(driver);

          const expectedDescription =
            'If you approve this request, a third party known for scams will take all your assets.';

          await openDappAndClickButton(
            driver,
            '#maliciousContractInteractionButton',
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

  describe('Malicious ERC20 Approval ', function () {
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

    it('should show banner alert', async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withNetworkControllerOnMainnet()
            .withPermissionControllerConnectedToTestDapp()
            .withPreferencesController(preferencesOptions)
            .build(),
          defaultGanacheOptions,
          testSpecificMock: mockMaliciousResponses,
          title: this?.test?.fullTitle(),
        },

        async ({ driver }) => {
          await initializePages(driver);
          const confirmation = new Confirmation(driver);

          const expectedDescription =
            'If you approve this request, a third party known for scams might take all your assets.';

          await openDappAndTriggerSignature(
            driver,
            SignatureType.MaliciousApproval,
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

  describe('Malicious ERC20 Transfer', function () {
    const maliciousTransferAlert: SecurityAlertResponse = {
      block: 1,
      result_type: 'Malicious',
      reason: 'transfer_farming',
      description:
        'Transfer to 0x5fbdb2315678afecb367f032d93f642f64180aa3, classification: A known malicious address is involved in the transaction',
      features: ['A known malicious address is involved in the transaction'],
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
              data: '0xa9059cbb0000000000000000000000005fbdb2315678afecb367f032d93f642f64180aa30000000000000000000000000000000000000000000000000000000000000064',
              to: CONTRACT_ADDRESS.USDC,
              value: '0x0',
            },
          ],
        })
        .thenJson(201, response);
    }

    async function mockMaliciousResponses(mockServer: MockttpServer) {
      await mockRequest(mockServer, maliciousTransferAlert);
    }

    it('should show banner alert', async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withNetworkControllerOnMainnet()
            .withPermissionControllerConnectedToTestDapp()
            .withPreferencesController(preferencesOptions)
            .build(),
          defaultGanacheOptions,
          testSpecificMock: mockMaliciousResponses,
          title: this?.test?.fullTitle(),
        },

        async ({ driver }) => {
          await initializePages(driver);
          const confirmation = new Confirmation(driver);

          const expectedDescription =
            'If you approve this request, a third party known for scams will take all your assets.';

          await openDappAndClickButton(driver, '#maliciousERC20TransferButton');

          await confirmation.checkLoadingSpinner();
          await confirmation.validateBannerAlert({
            expectedTitle,
            expectedDescription,
          });
        },
      );
    });
  });

  describe('Security Alerts API - Set Approval to All @no-mmi', function () {
    const maliciousApprovalAlert: SecurityAlertResponse = {
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
          params: [
            {
              from: SELECTED_ADDRESS,
              data: '0xa22cb465000000000000000000000000b85492afc686d5ca405e3cd4f50b05d358c75ede0000000000000000000000000000000000000000000000000000000000000001',
              to: CONTRACT_ADDRESS.BAYC,
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
    it('should show banner alert', async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withNetworkControllerOnMainnet()
            .withPermissionControllerConnectedToTestDapp()
            .withPreferencesController(preferencesOptions)
            .build(),
          defaultGanacheOptions,
          testSpecificMock: mockMaliciousResponses,
          title: this?.test?.title,
        },

        async ({ driver }) => {
          await initializePages(driver);
          const confirmation = new Confirmation(driver);

          const expectedDescription =
            'If you approve this request, you might lose your assets.';

          await openDappAndTriggerSignature(
            driver,
            SignatureType.MaliciousSetApprovalForAll,
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
