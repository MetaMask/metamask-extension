import React from 'react';
import { EtherDenomination } from '../../../../shared/constants/common';
import {
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import CurrencyDisplay from '../../ui/currency-display/currency-display.component';
import { BalanceChange } from './types';

export const FiatDisplay: React.FC<BalanceChange> = ({
  absChange,
  assetInfo,
}) => {
  if (assetInfo.isNative) {
    const value = absChange
      .toBase(16)
      .toDenomination(EtherDenomination.WEI)
      .toString();
    return (
      <CurrencyDisplay
        textProps={{
          color: TextColor.textAlternative,
          variant: TextVariant.bodySm,
        }}
        suffixProps={{
          color: TextColor.textAlternative,
          variant: TextVariant.bodySm,
          paddingRight: 2,
        }}
        currency="usd"
        value={value}
      />
    );
  }
  return null;
};
