import React from 'react';
import { useAddToken } from '../../../../hooks/tokens';
import { CustomAmountInfo } from '../../../info/custom-amount-info';
import { PERPS_CURRENCY, ARBITRUM_USDC } from '../../../../constants/perps';

export const PerpsDepositInfo = () => {
  useAddToken({
    chainId: ARBITRUM_USDC.chainId,
    decimals: ARBITRUM_USDC.decimals,
    name: ARBITRUM_USDC.name,
    symbol: ARBITRUM_USDC.symbol,
    tokenAddress: ARBITRUM_USDC.address,
  });

  return <CustomAmountInfo currency={PERPS_CURRENCY} hasMax />;
};
