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
