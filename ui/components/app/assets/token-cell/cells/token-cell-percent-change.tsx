import React from 'react';
import { useSelector } from 'react-redux';
import { getNativeTokenAddress } from '@metamask/assets-controllers';
import { CaipAssetType, Hex } from '@metamask/utils';
import { getMarketData } from '../../../../../selectors';
import { TokenFiatDisplayInfo } from '../../types';
import { PercentageChange } from '../../../../multichain/token-list-item/price/percentage-change';
import { getAssetsRates } from '../../../../../selectors/assets';
import { isEvmChainId } from '../../../../../../shared/lib/asset-utils';

type TokenCellPercentChangeProps = {
  token: TokenFiatDisplayInfo;
};

export const TokenCellPercentChange = React.memo(
  ({ token }: TokenCellPercentChangeProps) => {
    const isEvm = isEvmChainId(token.chainId);
    const multiChainMarketData = useSelector(getMarketData);
    const nonEvmConversionRates = useSelector(getAssetsRates);

    const tokenAddress =
      token.isNative && isEvm
        ? getNativeTokenAddress(token.chainId as Hex)
        : token.address;

    const tokenPercentageChange = isEvm
      ? multiChainMarketData?.[token.chainId]?.[tokenAddress]
          ?.pricePercentChange1d
      : nonEvmConversionRates?.[tokenAddress as CaipAssetType]?.marketData
          ?.pricePercentChange?.P1D;

    return (
      <PercentageChange value={tokenPercentageChange} address={tokenAddress} />
    );
  },
  (prevProps, nextProps) => prevProps.token.address === nextProps.token.address,
);
