import React from 'react';
import { useSelector } from 'react-redux';
import { getNativeTokenAddress } from '@metamask/assets-controllers';
import { CaipAssetType, Hex } from '@metamask/utils';
import {
  getIsMultichainAccountsState2Enabled,
  getMarketData,
} from '../../../../../selectors';
import { getMultichainIsEvm } from '../../../../../selectors/multichain';
import { TokenFiatDisplayInfo } from '../../types';
import { PercentageChange } from '../../../../multichain/token-list-item/price/percentage-change';
import { getAssetsRates } from '../../../../../selectors/assets';

type TokenCellPercentChangeProps = {
  token: TokenFiatDisplayInfo;
};

export const TokenCellPercentChange = React.memo(
  ({ token }: TokenCellPercentChangeProps) => {
    const isEvm = useSelector(getMultichainIsEvm);
    const multiChainMarketData = useSelector(getMarketData);
    const nonEvmConversionRates = useSelector(getAssetsRates);
    const isMultichainAccountsState2Enabled = useSelector(
      getIsMultichainAccountsState2Enabled,
    );

    if (isMultichainAccountsState2Enabled) {
      const tokenPercentageChange = token.type?.startsWith('eip155')
        ? multiChainMarketData?.[token.chainId]?.[token.assetId as string]
            ?.pricePercentChange1d
        : nonEvmConversionRates?.[token.assetId as CaipAssetType]?.marketData
            ?.pricePercentChange?.P1D;

      return (
        <PercentageChange
          value={tokenPercentageChange}
          address={token.assetId as `0x${string}` | CaipAssetType}
        />
      );
    }

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
