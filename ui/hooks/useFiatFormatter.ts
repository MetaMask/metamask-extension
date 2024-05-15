import { useSelector } from 'react-redux';
import { getIntlLocale } from '../ducks/locale/locale';
import { getCurrentCurrency } from '../selectors';

/**
 * Returns a function that formats a fiat amount as a localized string.
 *
 * Example usage:
 *
 * ```
 * const formatFiat = useFiatFormatter();
 * const formattedAmount = formatFiat(1000);
 * ```
 *
 * @returns A function that takes a fiat amount as a number and returns a formatted string.
 */

type FiatFormatter = (fiatAmount: number) => string;

export const useFiatFormatter = (): FiatFormatter => {
  const locale = useSelector(getIntlLocale);
  const fiatCurrency = useSelector(getCurrentCurrency);

  return (fiatAmount: number) => {
    return Intl.NumberFormat(locale, {
      style: 'currency',
      currency: fiatCurrency,
    }).format(fiatAmount);
  };
};
