import React from 'react';
import { useSelector } from 'react-redux';
import { getNativeTokenAddress } from '@metamask/assets-controllers';
import { Hex } from '@metamask/utils';
import { Skeleton } from '@metamask/design-system-react';
import { getCachedPercentChange } from '../../../../../../shared/lib/token-price';
import { getMarketData } from '../../../../../selectors';
import { TokenFiatDisplayInfo } from '../../types';
import { PercentageChange } from '../../../../multichain/token-list-item/price/percentage-change';
import { getAssetsRates } from '../../../../../selectors/assets';
import { isEvmChainId } from '../../../../../../shared/lib/asset-utils';

type TokenCellPercentChangeProps = {
  token: TokenFiatDisplayInfo;
  price?: number;
  comparePrice?: number;
};

export const TokenCellPercentChange = React.memo(
  ({ token, price, comparePrice }: TokenCellPercentChangeProps) => {
    const isEvm = isEvmChainId(token.chainId);
    const multiChainMarketData = useSelector(getMarketData);
    const nonEvmConversionRates = useSelector(getAssetsRates);

    const tokenAddress =
      token.isNative && isEvm
        ? // For custom networks with a slip44, this will be `0x0000...` instead of slip44.
          getNativeTokenAddress(token.chainId as Hex)
        : token.address;

    if (token.isFiatLoading) {
      return (
        <Skeleton
          className="h-3.5 w-8"
          data-testid="multichain-token-list-item-percentage-skeleton"
        />
      );
    }

    let tokenPercentageChange;

    if (typeof price === 'number' && typeof comparePrice === 'number') {
      tokenPercentageChange = ((price - comparePrice) / comparePrice) * 100;
    } else if (typeof token.pricePercentChange1d === 'number') {
      tokenPercentageChange = token.pricePercentChange1d;
    } else {
      tokenPercentageChange = getCachedPercentChange({
        isNative: Boolean(token.isNative),
        chainId: token.chainId,
        address: token.address,
        marketData: multiChainMarketData,
        conversionRates: nonEvmConversionRates,
      });
    }

    return (
      <PercentageChange value={tokenPercentageChange} address={tokenAddress} />
    );
  },
  (prevProps, nextProps) =>
    prevProps.token.address === nextProps.token.address &&
    prevProps.token.isFiatLoading === nextProps.token.isFiatLoading &&
    prevProps.token.pricePercentChange1d ===
      nextProps.token.pricePercentChange1d &&
    prevProps.price === nextProps.price &&
    prevProps.comparePrice === nextProps.comparePrice,
);
