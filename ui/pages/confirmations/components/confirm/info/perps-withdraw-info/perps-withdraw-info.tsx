import React from 'react';
import { useAddToken } from '../../../../hooks/tokens/useAddToken';
import { useTransactionPayPostQuote } from '../../../../hooks/pay/useTransactionPayPostQuote';
import { usePerpsWithdrawDefaultToken } from '../../../../hooks/pay/usePerpsWithdrawDefaultToken';
import { CustomAmountInfo } from '../../../info/custom-amount-info';
import { PerpsWithdrawBalance } from '../../../perps-confirmations/perps-withdraw-balance';
import { PERPS_CURRENCY, ARBITRUM_USDC } from '../../../../constants/perps';
import { usePerpsLiveAccount } from '../../../../../../hooks/perps/stream';

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
  const balanceUsdOverride =
    parseFloat(
      account?.withdrawableBalance ?? account?.spendableBalance ?? '0',
    ) || 0;

  return (
    // Percentage buttons (25/50/75/Max) are intentionally hidden for MVP —
    // not passing `hasMax` so they never render. Re-enable by passing
    // `hasMax` (and optionally a `percentages` override) when ready.
    <CustomAmountInfo
      autoFocusAmount
      balanceUsdOverride={balanceUsdOverride}
      currency={PERPS_CURRENCY}
      hidePayTokenAmount
      preferredToken={preferredToken}
    >
      <PerpsWithdrawBalance />
    </CustomAmountInfo>
  );
};
