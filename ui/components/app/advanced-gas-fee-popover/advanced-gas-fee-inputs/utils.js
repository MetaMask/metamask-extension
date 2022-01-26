import { uniq } from 'lodash';
import { toBigNumber } from '../../../../../shared/modules/conversion.utils';

export function roundToDecimalPlacesRemovingExtraZeroes(
  numberish,
  numberOfDecimalPlaces,
) {
  if (numberish) {
    return toBigNumber.dec(
      toBigNumber.dec(numberish).toFixed(numberOfDecimalPlaces),
    );
  }
  return null;
}

export const renderFeeRange = (feeRange) => {
  if (feeRange) {
    const formattedRange = uniq(
      feeRange.map((fee) => roundToDecimalPlacesRemovingExtraZeroes(fee, 2)),
    ).join(' - ');
    return `${formattedRange} GWEI`;
  }
  return null;
};
