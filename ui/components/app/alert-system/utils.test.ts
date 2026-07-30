import { Severity } from '../../../helpers/constants/design-system';
import { getBannerAlertSeverity } from './utils';

jest.mock('../../../hooks/useI18nContext');

describe('Utils', () => {
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
