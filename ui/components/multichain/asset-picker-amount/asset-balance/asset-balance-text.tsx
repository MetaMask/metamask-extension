import React from 'react';
import { useSelector } from 'react-redux';
import { Text } from '../../../component-library';
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
  FontWeight,
} from '../../../../helpers/constants/design-system';
import CurrencyDisplay from '../../../ui/currency-display';
import { useTokenTracker } from '../../../../hooks/useTokenTracker';
import { useCurrencyDisplay } from '../../../../hooks/useCurrencyDisplay';
import { useTokenFiatAmount } from '../../../../hooks/useTokenFiatAmount';
import { getIsFiatPrimary } from '../utils';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { hexToDecimal } from '../../../../../shared/modules/conversion.utils';

export type AssetBalanceTextProps = {
  asset: Asset;
  balanceColor: TextColor;
};

export function AssetBalanceText({
  asset,
  balanceColor,
}: AssetBalanceTextProps) {
  const t = useI18nContext();
  const secondaryCurrency = useSelector(getCurrentCurrency);

  const isFiatPrimary = useSelector(getIsFiatPrimary);

  const { tokensWithBalances } = useTokenTracker({
    tokens: [{ address: asset.details?.address }],
    address: undefined,
  });
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  if (asset.type === AssetType.NFT) {
    const numberOfTokens = hexToDecimal(asset.balance || '0x0');
    return (
      <Text fontWeight={FontWeight.Medium} {...commonProps.textProps}>
        {numberOfTokens}{' '}
        {t(numberOfTokens === '1' ? 'token' : 'tokens')?.toLowerCase()}
      </Text>
    );
  }

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
  if (asset.details?.address) {
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
  }

  // this should never happen
  return null;
}
