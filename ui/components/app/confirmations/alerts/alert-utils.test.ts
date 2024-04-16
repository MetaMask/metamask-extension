import {
  BackgroundColor,
  Severity,
} from '../../../../helpers/constants/design-system';
import { getSeverityBackground } from './alert-utils';

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
