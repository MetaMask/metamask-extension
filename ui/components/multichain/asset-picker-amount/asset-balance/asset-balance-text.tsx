import React from 'react';
import { useSelector } from 'react-redux';
import { Text } from '../../../component-library';
import UserPreferencedCurrencyDisplay from '../../../app/user-preferenced-currency-display';
import { PRIMARY } from '../../../../helpers/constants/common';
import { Asset } from '../../../../ducks/send';
import { getSelectedAccountCachedBalance } from '../../../../selectors';
import { AssetType } from '../../../../../shared/constants/transaction';
import {
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import CurrencyDisplay from '../../../ui/currency-display';
import { useTokenTracker } from '../../../../hooks/useTokenTracker';
import { useCurrencyDisplay } from '../../../../hooks/useCurrencyDisplay';
import { useTokenFiatAmount } from '../../../../hooks/useTokenFiatAmount';
import { getIsFiatPrimary } from '../utils';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { hexToDecimal } from '../../../../../shared/modules/conversion.utils';
import { TokenWithBalance } from '../asset-picker-modal/types';
import { getCurrentCurrency } from '../../../../ducks/metamask/metamask';

export type AssetBalanceTextProps = {
  asset: Asset;
  balanceColor: TextColor;
  error?: string;
};

export function AssetBalanceText({
  asset,
  balanceColor,
  error,
}: AssetBalanceTextProps) {
  const t = useI18nContext();
  const secondaryCurrency = useSelector(getCurrentCurrency);

  const isFiatPrimary = useSelector(getIsFiatPrimary);

  const { tokensWithBalances }: { tokensWithBalances: TokenWithBalance[] } =
    useTokenTracker({
      tokens:
        asset.details?.address && !asset.balance
          ? [{ address: asset.details.address }]
          : [],
      address: undefined,
    });

  const balanceString =
    hexToDecimal(asset.balance) || tokensWithBalances[0]?.string;

  const balanceValue = useSelector(getSelectedAccountCachedBalance);

  const nativeTokenFiatBalance = useCurrencyDisplay(balanceValue, {
    numberOfDecimals: 2,
    currency: secondaryCurrency,
  })[1].value;

  const erc20TokenFiatBalance = useTokenFiatAmount(
    asset.details?.address,
    balanceString,
    undefined,
    // if balance is zero, conversion rate will not be available so we just assume ~0 we can't use 0 because it will set off an undefined guard
    Number(balanceString) === 0
      ? { exchangeRate: Number.MIN_VALUE }
      : undefined,
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

  const errorText = error ? `. ${t(error)}` : '';

  if (asset.type === AssetType.NFT) {
    const numberOfTokens = hexToDecimal(asset.balance || '0x0');
    return (
      <Text {...commonProps.textProps}>
        {`${numberOfTokens} ${t(
          numberOfTokens === '1' ? 'token' : 'tokens',
        )?.toLowerCase()}${errorText}`}
      </Text>
    );
  }

  if (isFiatPrimary) {
    return (
      <CurrencyDisplay
        {...commonProps}
        currency={secondaryCurrency}
        numberOfDecimals={2}
        displayValue={`${formattedFiat}${errorText}`}
      />
    );
  }

  if (asset.type === AssetType.native) {
    return (
      <>
        <UserPreferencedCurrencyDisplay
          {...commonProps}
          value={asset.balance}
          type={PRIMARY}
        />
        {errorText ? (
          <Text
            variant={TextVariant.bodySm}
            color={TextColor.errorDefault}
            data-testid="send-page-amount-error"
          >
            {errorText}
          </Text>
        ) : null}
      </>
    );
  }

  // catch-all for non-natives; they should all have addresses
  if (asset.details?.address) {
    return (
      <UserPreferencedCurrencyDisplay
        {...commonProps}
        displayValue={`${balanceString || ''}${errorText}`}
      />
    );
  }

  // this should never happen
  return null;
}
