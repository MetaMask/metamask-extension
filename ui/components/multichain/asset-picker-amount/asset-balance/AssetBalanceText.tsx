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

export default function AssetBalanceText({
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

  if (isFiatPrimary) {
    return (
      <CurrencyDisplay
        hideLabel
        className="currency-input__conversion-component"
        currency={secondaryCurrency}
        value={undefined}
        numberOfDecimals={2}
        displayValue={formattedFiat}
        data-testid={undefined}
        style={undefined}
        prefix={undefined}
        prefixComponent={undefined}
        hideTitle={undefined}
        denomination={undefined}
        suffix={undefined}
      />
    );
  } else if (asset.type === AssetType.native) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: Other props are optional but the compiler expects them
    return (
      <UserPreferencedCurrencyDisplay
        hideLabel
        value={asset.balance}
        type={PRIMARY}
        textProps={{
          color: balanceColor,
          variant: TextVariant.bodySm,
        }}
        suffixProps={{
          color: balanceColor,
          variant: TextVariant.bodySm,
        }}
        data-testid={undefined}
        ethNumberOfDecimals={undefined}
        fiatNumberOfDecimals={undefined}
        numberOfDecimals={undefined}
        showEthLogo={undefined}
        showFiat={undefined}
        showNative={undefined}
        showCurrencySuffix={undefined}
      />
    );
  }
  return (
    <TokenBalance
      hideLabel
      token={{
        ...asset.details,
        decimals: asset.details?.decimals
          ? Number(asset.details.decimals)
          : undefined,
      }}
      textProps={{
        color: balanceColor,
        variant: TextVariant.bodySm,
      }}
      suffixProps={{
        color: balanceColor,
        variant: TextVariant.bodySm,
      }}
      className={undefined}
      showFiat={undefined}
    />
  );
}
