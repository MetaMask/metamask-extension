import zxcvbn from 'zxcvbn';
import { PASSWORD_MIN_LENGTH } from '../constants/common';

export function camelCaseToCapitalize(str = '') {
  return str.replace(/([A-Z])/gu, ' $1').replace(/^./u, (s) => s.toUpperCase());
}

export function getCurrencySymbol(currencyCode) {
  const supportedCurrencyCodes = {
    EUR: '\u20AC',
    HKD: '\u0024',
    JPY: '\u00A5',
    PHP: '\u20B1',
    RUB: '\u20BD',
    SGD: '\u0024',
    USD: '\u0024',
  };
  if (supportedCurrencyCodes[currencyCode.toUpperCase()]) {
    return supportedCurrencyCodes[currencyCode.toUpperCase()];
  }
  return currencyCode.toUpperCase();
}

/**
 * Determines the password strength category based on zxcvbn score and minimum length
 *
 * @param {string} passwordValue - The password to evaluate
 * @returns {'weak' | 'good' | 'strong'} The password strength category
 */
export function getPasswordStrengthCategory(passwordValue) {
  const isTooShort = passwordValue.length < PASSWORD_MIN_LENGTH;
  const { score } = zxcvbn(passwordValue);

  if (isTooShort || score < 3) {
    return 'weak';
  }
  if (score === 3) {
    return 'good';
  }
  return 'strong';
}
