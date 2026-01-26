import React from 'react';
import { useAddToken } from '../../../../hooks/tokens';
import { CustomAmountInfo } from '../../../info/custom-amount-info';
import { MAINNET_MUSD } from '../../../../constants/musd';

export const MusdConversionInfo = () => {
  useAddToken({
    chainId: MAINNET_MUSD.chainId,
    decimals: MAINNET_MUSD.decimals,
    name: MAINNET_MUSD.name,
    symbol: MAINNET_MUSD.symbol,
    tokenAddress: MAINNET_MUSD.address,
  });

  return <CustomAmountInfo hasMax />;
};
