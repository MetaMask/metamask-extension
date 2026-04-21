import React from 'react';
import { useAddToken } from '../../../../hooks/tokens/useAddToken';
import { CustomAmountInfo } from '../../../info/custom-amount-info';
import { PerpsWithdrawBalance } from '../../../perps-confirmations/perps-withdraw-balance';
import { PERPS_CURRENCY, ARBITRUM_USDC } from '../../../../constants/perps';

export const PerpsWithdrawInfo = () => {
  useAddToken({
    chainId: ARBITRUM_USDC.chainId,
    decimals: ARBITRUM_USDC.decimals,
    symbol: ARBITRUM_USDC.symbol,
    tokenAddress: ARBITRUM_USDC.address,
  });

  return (
    <CustomAmountInfo currency={PERPS_CURRENCY} hasMax hidePayTokenAmount>
      <PerpsWithdrawBalance />
    </CustomAmountInfo>
  );
};
