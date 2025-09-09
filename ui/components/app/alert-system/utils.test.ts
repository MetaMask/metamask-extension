import { Alert } from '../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../helpers/constants/design-system';
import { getBannerAlertSeverity, getHighestSeverity } from './utils';

jest.mock('../../../hooks/useI18nContext');

describe('Utils', () => {
  describe('getHighestSeverity', () => {
    describe('returns the highest severity from an array of alerts', () => {
      const alertsMock: Alert[] = [
        { key: 'key', message: 'mocked message', severity: Severity.Info },
        { key: 'key 1', message: 'mocked message', severity: Severity.Warning },
        { key: 'key 2', message: 'mocked message', severity: Severity.Danger },
      ];

      // @ts-expect-error This is missing from the Mocha type definitions
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
      ])('%s', (_desc: string, alerts: Alert[], expected: Severity) => {
        const result = getHighestSeverity(alerts);
        expect(result).toBe(expected);
      });
    });
  });

  describe('getBannerAlertSeverity', () => {
    // @ts-expect-error This is missing from the Mocha type definitions
    it.each([
      [Severity.Danger, 'danger'],
      [Severity.Warning, 'warning'],
      [Severity.Info, 'info'],
    ])('maps %s to %s', (inputSeverity: Severity, expectedSeverity: string) => {
      expect(getBannerAlertSeverity(inputSeverity)).toBe(expectedSeverity);
    });
  });
});
