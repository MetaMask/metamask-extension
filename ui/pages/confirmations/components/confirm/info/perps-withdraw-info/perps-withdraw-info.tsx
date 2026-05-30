import React from 'react';
import { useAddToken } from '../../../../hooks/tokens/useAddToken';
import { useTransactionPayPostQuote } from '../../../../hooks/pay/useTransactionPayPostQuote';
import { usePerpsWithdrawDefaultToken } from '../../../../hooks/pay/usePerpsWithdrawDefaultToken';
import { CustomAmountInfo } from '../../../info/custom-amount-info';
import { PerpsWithdrawBalance } from '../../../perps-confirmations/perps-withdraw-balance';
import { PERPS_CURRENCY, ARBITRUM_USDC } from '../../../../constants/perps';
import { usePerpsLiveAccount } from '../../../../../../hooks/perps/stream';
import { getTradeableBalance } from '../../../../../../hooks/perps/getTradeableBalance';

export const PerpsWithdrawInfo = () => {
  useAddToken({
    chainId: ARBITRUM_USDC.chainId,
    decimals: ARBITRUM_USDC.decimals,
    symbol: ARBITRUM_USDC.symbol,
    tokenAddress: ARBITRUM_USDC.address,
  });

  useTransactionPayPostQuote();

  const preferredToken = usePerpsWithdrawDefaultToken();

  const { account } = usePerpsLiveAccount();
  const availableBalance = Number(getTradeableBalance(account)) || 0;

  return (
    <CustomAmountInfo
      autoFocusAmount
      balanceUsdOverride={availableBalance}
      currency={PERPS_CURRENCY}
      hasMax
      hidePayTokenAmount
      preferredToken={preferredToken}
    >
      <PerpsWithdrawBalance />
    </CustomAmountInfo>
  );
};
