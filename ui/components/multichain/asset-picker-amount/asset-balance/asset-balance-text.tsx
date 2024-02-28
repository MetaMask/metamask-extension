import React from 'react';
import { useSelector } from 'react-redux';
import UserPreferencedCurrencyDisplay from '../../../app/user-preferenced-currency-display';
import { PRIMARY } from '../../../../helpers/constants/common';
import TokenBalance from '../../../ui/token-balance';
import { Asset } from '../../../../ducks/send';
import {
  getCurrentCurrency,
  getSelectedAccountCachedBalance,
} from '../../../../selectors';
import { AssetType } from '../../../../../shared/constants/transaction';
import {
  type TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import CurrencyDisplay from '../../../ui/currency-display';
import { useTokenTracker } from '../../../../hooks/useTokenTracker';
import { useCurrencyDisplay } from '../../../../hooks/useCurrencyDisplay';
import { useTokenFiatAmount } from '../../../../hooks/useTokenFiatAmount';
import useIsFiatPrimary from '../hooks/useIsFiatPrimary';

export interface AssetBalanceTextProps {
  asset: Asset;
  balanceColor: TextColor;
}

export function AssetBalanceText({
  asset,
  balanceColor,
}: AssetBalanceTextProps) {
  const secondaryCurrency = useSelector(getCurrentCurrency);

  const isFiatPrimary = useIsFiatPrimary();

  const { tokensWithBalances } = useTokenTracker({
    tokens: [{ address: asset.details?.address }],
    address: undefined,
  });
  const balanceString = (tokensWithBalances[0] as any)?.string;

  const balanceValue = useSelector(getSelectedAccountCachedBalance);

  const nativeTokenFiatBalance = useCurrencyDisplay(balanceValue, {
    numberOfDecimals: 2,
    currency: secondaryCurrency,
  })[1].value;

  const erc20TokenFiatBalance = useTokenFiatAmount(
    asset.details?.address,
    balanceString,
    undefined,
    undefined,
    true,
  );

  const formattedFiat =
    asset.type === AssetType.native
      ? nativeTokenFiatBalance
      : erc20TokenFiatBalance;

  const commonProps = {
    hideLabel: true,
    textProps: {
      color: balanceColor,
      variant: TextVariant.bodySm,
    },
    suffixProps: {
      color: balanceColor,
      variant: TextVariant.bodySm,
    },
  };

  if (isFiatPrimary) {
    return (
      <CurrencyDisplay
        {...commonProps}
        currency={secondaryCurrency}
        numberOfDecimals={2}
        displayValue={formattedFiat}
      />
    );
  }

  if (asset.type === AssetType.native) {
    return (
      <UserPreferencedCurrencyDisplay
        {...commonProps}
        value={asset.balance}
        type={PRIMARY}
      />
    );
  }

  // catch-all for non-natives; they should all have addresses
  if (asset.details?.address)
    return (
      <TokenBalance
        {...commonProps}
        token={{
          ...asset.details,
          decimals: asset.details.decimals
            ? Number(asset.details.decimals)
            : undefined,
        }}
      />
    );

  // this should never happen
  return null;
}
