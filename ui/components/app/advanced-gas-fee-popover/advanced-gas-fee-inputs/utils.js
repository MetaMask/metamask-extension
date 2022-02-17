import { uniq } from 'lodash';

import { roundToDecimalPlacesRemovingExtraZeroes } from '../../../../helpers/utils/util';

export const renderFeeRange = (feeRange) => {
  if (feeRange) {
    const formattedRange = uniq(
      feeRange.map((fee) => roundToDecimalPlacesRemovingExtraZeroes(fee, 2)),
    ).join(' - ');
    return `${formattedRange} GWEI`;
  }
  return null;
};
