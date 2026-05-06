import React from 'react';
import { useAddToken } from '../../../../hooks/tokens/useAddToken';
import { useTransactionPayPostQuote } from '../../../../hooks/pay/useTransactionPayPostQuote';
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

  // Release-branch Unified Account bridge: source the custom-amount percentage
  // balance from the user-visible Perps withdraw max.
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
      balanceUsdOverride={balanceUsdOverride}
      currency={PERPS_CURRENCY}
      hidePayTokenAmount
    >
      <PerpsWithdrawBalance />
    </CustomAmountInfo>
  );
};
