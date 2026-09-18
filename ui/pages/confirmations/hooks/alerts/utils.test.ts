import {
  BlockaidReason,
  BlockaidResultType,
} from '../../../../../shared/constants/security-provider';
import { Severity } from '../../../../helpers/constants/design-system';
import { SecurityAlertResponse } from '../../types/confirm';
import { getProviderAlertSeverity, normalizeProviderAlert } from './utils';

describe('Utils', () => {
  describe('getProviderAlertSeverity', () => {
    // @ts-expect-error This is missing from the Mocha type definitions
    it.each([
      [BlockaidResultType.Malicious, Severity.Danger],
      [BlockaidResultType.Warning, Severity.Warning],
      ['Other', Severity.Info],
    ])(
      'maps %s to %s',
      (inputSeverity: BlockaidResultType, expectedSeverity: Severity) => {
        expect(
          getProviderAlertSeverity(inputSeverity as BlockaidResultType),
        ).toBe(expectedSeverity);
      },
    );
  });

  describe('normalizeProviderAlert', () => {
    const mockT = jest.fn((key: string, substitutions?: string[]) =>
      substitutions?.length ? `${key}|${substitutions.join('|')}` : key,
    );

    const buildResponse = (reason: string): SecurityAlertResponse => ({
      securityAlertId: 'test-id',
      reason,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      result_type: BlockaidResultType.Malicious,
      features: ['Feature 1', 'Feature 2'],
    });

    it('normalizes a security alert response correctly', () => {
      const normalizedAlert = normalizeProviderAlert(
        buildResponse(BlockaidReason.transferFarming),
        mockT,
      );
      expect(normalizedAlert.key).toBe('test-id');
      expect(normalizedAlert.reason).toBe('blockaidTitleHighRiskTransfer');
      expect(normalizedAlert.severity).toBe(Severity.Danger);
      expect(normalizedAlert.alertDetails).toEqual(['Feature 1', 'Feature 2']);
      expect(normalizedAlert.message).toBe(
        'blockaidDescriptionTransferFarming',
      );
    });

    // @ts-expect-error This is missing from the Mocha type definitions
    it.each([
      [BlockaidReason.approvalFarming, 'blockaidTitleHighRiskApproval'],
      [BlockaidReason.permitFarming, 'blockaidTitleHighRiskApproval'],
      [BlockaidReason.setApprovalForAll, 'blockaidTitleHighRiskApproval'],
      [BlockaidReason.seaportFarming, 'blockaidTitleHighRiskApproval'],
      [BlockaidReason.blurFarming, 'blockaidTitleHighRiskApproval'],
      [BlockaidReason.transferFarming, 'blockaidTitleHighRiskTransfer'],
      [BlockaidReason.transferFromFarming, 'blockaidTitleHighRiskTransfer'],
      [BlockaidReason.rawNativeTokenTransfer, 'blockaidTitleHighRiskTransfer'],
      [BlockaidReason.maliciousDomain, 'blockaidTitleSiteFlaggedUnsafe'],
      [BlockaidReason.rawSignatureFarming, 'blockaidTitleHighRiskSignature'],
      [BlockaidReason.tradeOrderFarming, 'blockaidTitleHighRiskSignature'],
      [BlockaidReason.other, 'blockaidTitleRiskSignalsDetected'],
      [BlockaidReason.errored, 'blockaidTitleMayNotBeSafe'],
      ['unknown-reason', 'blockaidTitleRiskSignalsDetected'],
    ])('uses title %s -> %s', (reason: string, expectedTitleKey: string) => {
      expect(normalizeProviderAlert(buildResponse(reason), mockT).reason).toBe(
        expectedTitleKey,
      );
    });

    it('injects the marketplace name for marketplace farming reasons', () => {
      expect(
        normalizeProviderAlert(
          buildResponse(BlockaidReason.seaportFarming),
          mockT,
        ).message,
      ).toBe('blockaidDescriptionMarketplaceFarming|OpenSea');
      expect(
        normalizeProviderAlert(buildResponse(BlockaidReason.blurFarming), mockT)
          .message,
      ).toBe('blockaidDescriptionMarketplaceFarming|Blur');
    });

    it('uses the amount variant when a sending fiat total is available', () => {
      expect(
        normalizeProviderAlert(
          buildResponse(BlockaidReason.transferFarming),
          mockT,
          undefined,
          '$1,234.56',
        ).message,
      ).toBe('blockaidDescriptionTransferFarmingWithAmount|$1,234.56');
      expect(
        normalizeProviderAlert(
          buildResponse(BlockaidReason.maliciousDomain),
          mockT,
          undefined,
          '$1,234.56',
        ).message,
      ).toBe('blockaidDescriptionMaliciousDomainWithAmount|$1,234.56');
    });

    it('ignores the amount for reasons with no amount variant', () => {
      expect(
        normalizeProviderAlert(
          buildResponse(BlockaidReason.approvalFarming),
          mockT,
          undefined,
          '$1,234.56',
        ).message,
      ).toBe('blockaidDescriptionApproveFarming');
    });

    it('falls back to the risk signals description for unknown reasons', () => {
      expect(
        normalizeProviderAlert(buildResponse('unknown-reason'), mockT).message,
      ).toBe('blockaidDescriptionRiskSignals');
    });
  });
});
