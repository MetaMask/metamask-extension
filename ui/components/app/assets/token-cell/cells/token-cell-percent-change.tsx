import React from 'react';
import { getNativeTokenAddress } from '@metamask/assets-controllers';
import { Hex } from '@metamask/utils';
import { TokenFiatDisplayInfo } from '../../types';
import { PercentageChange } from '../../../../multichain/token-list-item/price/percentage-change';
import { isEvmChainId } from '../../../../../../shared/lib/asset-utils';

type TokenCellPercentChangeProps = {
  token: TokenFiatDisplayInfo;
  price: number | undefined;
  comparePrice: number | undefined;
};

export const TokenCellPercentChange = React.memo(
  ({ token, price, comparePrice }: TokenCellPercentChangeProps) => {
    // Allow compare null and undefined
    // eslint-disable-next-line no-eq-null
    if (price == null || comparePrice == null) {
      return null;
    }

    const isEvm = isEvmChainId(token.chainId);

    const tokenAddress =
      token.isNative && isEvm
        ? getNativeTokenAddress(token.chainId as Hex)
        : token.address;

    const tokenPercentageChange = ((price - comparePrice) / comparePrice) * 100;

    return (
      <PercentageChange value={tokenPercentageChange} address={tokenAddress} />
    );
  },
  (prevProps, nextProps) =>
    prevProps.token.address === nextProps.token.address &&
    prevProps.price === nextProps.price &&
    prevProps.comparePrice === nextProps.comparePrice,
);
