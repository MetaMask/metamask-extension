import type { I18nFunction } from '../../contexts/i18n';
import { GAS_FORM_ERRORS, getGasFormErrorText } from './gas';

describe('getGasFormErrorText', () => {
  it('translates the requested gas error', () => {
    const t: I18nFunction = jest.fn(() => 'translated error');

    const result = getGasFormErrorText(GAS_FORM_ERRORS.MAX_FEE_TOO_LOW, t);

    expect(result).toBe('translated error');
    expect(t).toHaveBeenCalledWith('editGasMaxFeeLow');
  });

  it('formats a numeric minimum gas limit as a string substitution', () => {
    const t: I18nFunction = jest.fn(() => 'translated error');

    getGasFormErrorText(GAS_FORM_ERRORS.GAS_LIMIT_OUT_OF_BOUNDS, t, {
      minimumGasLimit: 21000,
    });

    expect(t).toHaveBeenCalledWith('editGasLimitOutOfBounds', ['21000']);
  });

  it('uses an empty substitution when the minimum gas limit is absent', () => {
    const t: I18nFunction = jest.fn(() => 'translated error');

    getGasFormErrorText(GAS_FORM_ERRORS.GAS_LIMIT_OUT_OF_BOUNDS, t);

    expect(t).toHaveBeenCalledWith('editGasLimitOutOfBounds', ['']);
  });
});
