import { BlockaidResultType } from '../../../../../shared/constants/security-provider';
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
    const mockT = jest.fn((key) => key);

    const mockResponse: SecurityAlertResponse = {
      securityAlertId: 'test-id',
      reason: 'test-reason',
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      result_type: BlockaidResultType.Malicious,
      features: ['Feature 1', 'Feature 2'],
    };

    it('normalizes a security alert response correctly', () => {
      const normalizedAlert = normalizeProviderAlert(mockResponse, mockT);
      expect(normalizedAlert.key).toBe('test-id');
      expect(normalizedAlert.reason).toBe('blockaidTitleDeceptive');
      expect(normalizedAlert.severity).toBe(Severity.Danger);
      expect(normalizedAlert.alertDetails).toEqual(['Feature 1', 'Feature 2']);
      expect(normalizedAlert.message).toBe(
        'blockaidDescriptionMightLoseAssets',
      );
    });
  });
});
