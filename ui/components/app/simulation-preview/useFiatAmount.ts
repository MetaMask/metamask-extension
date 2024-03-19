import { useSelector } from 'react-redux';
import { getTokenToFiatConversionRates } from '../../../selectors';
import { getConversionRate } from '../../../ducks/metamask/metamask';
import { Numeric } from '../../../../shared/modules/Numeric';
import { TokenStandard } from '../../../../shared/constants/transaction';
import { Amount, AssetIdentifier } from './types';
import { amountToNumeric } from './util';

export const FIAT_UNAVAILABLE = 'Fiat Unavailable';

/**
 * Describes an amount of fiat.
 */
export type FiatAmount = Numeric | typeof FIAT_UNAVAILABLE;

/**
 * Returns the fiat info for a list of balance changes.
 *
 * @param assetAmounts
 */
export function useFiatAmounts(
  assetAmounts: [AssetIdentifier, Amount][],
): FiatAmount[] {
  const nativeToFiatConversionRate = useSelector(getConversionRate);
  const tokenToFiatConversionRates = useSelector(getTokenToFiatConversionRates);

  return assetAmounts.map(([asset, amount]) => {
    const assetAmount = amountToNumeric(amount);
    const conversionRate =
      asset.standard === TokenStandard.none
        ? nativeToFiatConversionRate
        : tokenToFiatConversionRates[asset.address];

    return conversionRate
      ? assetAmount.applyConversionRate(conversionRate)
      : FIAT_UNAVAILABLE;
  });
}
