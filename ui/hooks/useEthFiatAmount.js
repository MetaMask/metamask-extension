import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { getCurrentCurrency, getShouldShowFiat } from '../selectors';
import { formatCurrency } from '../helpers/utils/confirm-tx.util';
import { getConversionRate } from '../ducks/metamask/metamask';
import { decEthToConvertedCurrency } from '../../shared/modules/conversion.utils';

/**
 * Get an Eth amount converted to fiat and formatted for display
 *
 * @param {string} [ethAmount] - The eth amount to convert
 * @param {object} [overrides] - A configuration object that allows the called to explicitly
 *                              ensure fiat is shown even if the property is not set in state.
 * @param {boolean} [overrides.showFiat] - If truthy, ensures the fiat value is shown even if the showFiat value from state is falsey
 * @param {boolean} hideCurrencySymbol - Indicates whether the returned formatted amount should include the trailing currency symbol
 * @returns {string} The formatted token amount in the user's chosen fiat currency
 */
export function useEthFiatAmount(
  ethAmount,
  overrides = {},
  hideCurrencySymbol,
) {
  const conversionRate = useSelector(getConversionRate);
  const currentCurrency = useSelector(getCurrentCurrency);
  const userPrefersShownFiat = useSelector(getShouldShowFiat);
  const showFiat = overrides.showFiat ?? userPrefersShownFiat;
  const formattedFiat = useMemo(
    () => decEthToConvertedCurrency(ethAmount, currentCurrency, conversionRate),
    [conversionRate, currentCurrency, ethAmount],
  );

  if (
    !showFiat ||
    currentCurrency.toUpperCase() === 'ETH' ||
    conversionRate <= 0 ||
    ethAmount === undefined
  ) {
    return undefined;
  }

  return hideCurrencySymbol
    ? formatCurrency(formattedFiat, currentCurrency)
    : `${formatCurrency(
        formattedFiat,
        currentCurrency,
      )} ${currentCurrency.toUpperCase()}`;
}
