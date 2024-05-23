import { BlockaidResultType } from '../../../../shared/constants/security-provider';
import { Alert } from '../../../ducks/confirm-alerts/confirm-alerts';
import {
  BackgroundColor,
  Severity,
} from '../../../helpers/constants/design-system';
import { SecurityAlertResponse } from '../../../pages/confirmations/types/confirm';
import {
  getBannerAlertSeverity,
  getHighestSeverity,
  getProviderAlertSeverity,
  getSeverityBackground,
  providerAlertNormalizer,
} from './utils';

jest.mock('../../../hooks/useI18nContext');

describe('Utils', () => {
  describe('getSeverityBackground', () => {
    it('returns the correct background color for Danger severity', () => {
      const result = getSeverityBackground(Severity.Danger);
      expect(result).toBe(BackgroundColor.errorMuted);
    });

    it('returns the correct background color for Warning severity', () => {
      const result = getSeverityBackground(Severity.Warning);
      expect(result).toBe(BackgroundColor.warningMuted);
    });

    it('returns the default background color for other severity levels', () => {
      const result = getSeverityBackground(Severity.Info);
      expect(result).toBe(BackgroundColor.primaryMuted);
    });
  });

  describe('getHighestSeverity', () => {
    describe('returns the highest severity from an array of alerts', () => {
      const alertsMock: Alert[] = [
        { key: 'key', message: 'mocked message', severity: Severity.Info },
        { key: 'key 1', message: 'mocked message', severity: Severity.Warning },
        { key: 'key 2', message: 'mocked message', severity: Severity.Danger },
      ];

      it.each([
        [
          `when the highest severity is ${Severity.Danger}`,
          alertsMock,
          Severity.Danger,
        ],
        [
          `when the highest severity is ${Severity.Warning}`,
          alertsMock.slice(0, 2),
          Severity.Warning,
        ],
        [
          `when the highest severity is ${Severity.Info}`,
          [alertsMock[0]],
          Severity.Info,
        ],
      ])('%s', (_desc, alerts, expected) => {
        const result = getHighestSeverity(alerts);
        expect(result).toBe(expected);
      });
    });
  });

  describe('getBannerAlertSeverity', () => {
    it.each([
      [Severity.Danger, 'danger'],
      [Severity.Warning, 'warning'],
      [Severity.Info, 'info'],
    ])('maps %s to %s', (inputSeverity, expectedSeverity) => {
      expect(getBannerAlertSeverity(inputSeverity)).toBe(expectedSeverity);
    });
  });

  describe('getProviderAlertSeverity', () => {
    it.each([
      [BlockaidResultType.Malicious, Severity.Danger],
      [BlockaidResultType.Warning, Severity.Warning],
      ['Other', Severity.Info],
    ])('maps %s to %s', (inputSeverity, expectedSeverity) => {
      expect(
        getProviderAlertSeverity(inputSeverity as BlockaidResultType),
      ).toBe(expectedSeverity);
    });
  });

  describe('providerAlertNormalizer', () => {
    const mockT = jest.fn((key) => key);
    // useI18nContext.mockReturnValue(mockT);

    const mockResponse: SecurityAlertResponse = {
      securityAlertId: 'test-id',
      reason: 'test-reason',
      result_type: BlockaidResultType.Malicious,
      features: ['Feature 1', 'Feature 2'],
    };

    it('normalizes a security alert response correctly', () => {
      const normalizedAlert = providerAlertNormalizer(mockResponse, mockT);
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
