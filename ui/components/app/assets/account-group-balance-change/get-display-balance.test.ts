import { TextColor } from '../../../../helpers/constants/design-system';
import { determineBalanceColor } from './get-display-balance';

describe('determineBalanceColor', () => {
  it('returns textAlternative in privacy mode regardless of value', () => {
    [100, -100, 0].forEach((v) =>
      expect(determineBalanceColor(v, true)).toBe(TextColor.textAlternative),
    );
  });

  it('returns successDefault for positive values', () => {
    [0.01, 100, 999999].forEach((v) =>
      expect(determineBalanceColor(v, false)).toBe(TextColor.successDefault),
    );
  });

  it('returns errorDefault for negative values', () => {
    [-0.01, -100, -999999].forEach((v) =>
      expect(determineBalanceColor(v, false)).toBe(TextColor.errorDefault),
    );
  });

  it('returns textDefault for zero or undefined', () => {
    [0, undefined].forEach((v) =>
      expect(determineBalanceColor(v, false)).toBe(TextColor.textDefault),
    );
  });
});
