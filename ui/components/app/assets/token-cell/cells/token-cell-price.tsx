import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { Hex } from '@metamask/utils';
import {
  FontWeight,
  Skeleton,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { AssetType } from '../../../../../../shared/constants/transaction';
import { getCurrentCurrency } from '../../../../../ducks/metamask/metamask';
import { useFormatters } from '../../../../../hooks/useFormatters';
import { getUseCurrencyRateCheck } from '../../../../../selectors';
import { useCachedPrice } from '../../../../../pages/asset/hooks/useCurrentPrice';
import type { Asset } from '../../../../../pages/asset/types/asset';
import { TokenFiatDisplayInfo } from '../../types';

type TokenCellPriceProps = {
  token: TokenFiatDisplayInfo;
};

/**
 * The token's current price in the user's currency.
 * A market-stats tick replaces the cached price. Renders a dash when neither is available.
 *
 * @param props - The component props.
 * @param props.token - The token to show the price of.
 */
export const TokenCellPrice = React.memo(({ token }: TokenCellPriceProps) => {
  const currency = useSelector(getCurrentCurrency);
  const useCurrencyRateCheck = useSelector(getUseCurrencyRateCheck);
  const { formatCurrencyTokenPrice } = useFormatters();

  const asset = useMemo<Asset>(() => {
    const common = {
      chainId: token.chainId as Hex,
      symbol: token.symbol,
      decimals: token.decimals,
      image: token.image,
    };

    return token.isNative
      ? { ...common, type: AssetType.native, isOriginalNativeSymbol: true }
      : { ...common, type: AssetType.token, address: token.address };
  }, [
    token.address,
    token.chainId,
    token.decimals,
    token.image,
    token.isNative,
    token.symbol,
  ]);

  const { currentPrice: cachedPrice } = useCachedPrice(asset);
  const currentPrice = token.livePrice ?? cachedPrice;

  if (token.isFiatLoading) {
    return (
      <Skeleton
        className="h-3.5 w-12"
        data-testid="multichain-token-list-item-price-skeleton"
      />
    );
  }

  return (
    <Text
      variant={TextVariant.BodyMd}
      color={TextColor.TextDefault}
      fontWeight={FontWeight.Medium}
      data-testid="multichain-token-list-item-price"
    >
      {useCurrencyRateCheck && currentPrice !== undefined
        ? formatCurrencyTokenPrice(currentPrice, currency)
        : '—'}
    </Text>
  );
});
