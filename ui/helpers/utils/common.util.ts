export function camelCaseToCapitalize(str = ''): string {
  return str.replace(/([A-Z])/gu, ' $1').replace(/^./u, (s) => s.toUpperCase());
}

export function getCurrencySymbol(currencyCode: string): string {
  const supportedCurrencyCodes: Record<string, string> = {
    EUR: '€',
    HKD: '$',
    JPY: '¥',
    PHP: '₱',
    RUB: '₽',
    SGD: '$',
    USD: '$',
  };
  if (supportedCurrencyCodes[currencyCode.toUpperCase()]) {
    return supportedCurrencyCodes[currencyCode.toUpperCase()];
  }
  return currencyCode.toUpperCase();
}
