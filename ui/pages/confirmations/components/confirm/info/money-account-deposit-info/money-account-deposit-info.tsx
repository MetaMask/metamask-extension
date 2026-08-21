import React from 'react';
import { useAddToken } from '../../../../hooks/tokens/useAddToken';
import { CustomAmountInfo } from '../../../info/custom-amount-info';
import { BalanceProjection } from '../../../money-account-confirmations/balance-projection';
import {
  MUSD_CONVERSION_DEFAULT_CHAIN_ID,
  MUSD_TOKEN,
  MUSD_TOKEN_ADDRESS,
} from '../../../../constants/musd';

const MONEY_ACCOUNT_DEPOSIT_CURRENCY = 'usd';

const PROJECTED_YEARS = 1;

/**
 * Amount-screen subtitle for the deposit flow.
 *
 * Defined at module scope rather than inline in {@link MoneyAccountDepositInfo}
 * so the reference stays stable across renders: an inline arrow would be a new
 * function on every render, defeating the `React.memo` on `CustomAmountInfo`
 * and remounting the subtree it returns.
 *
 * @param amountFiat - Fiat amount currently in the custom-amount input.
 * @returns The APY pitch / projected balance subtitle.
 */
const renderAmountDetails = (amountFiat: string) => (
  <BalanceProjection amountFiat={amountFiat} projectedYears={PROJECTED_YEARS} />
);

export const MoneyAccountDepositInfo = () => {
  useAddToken({
    chainId: MUSD_CONVERSION_DEFAULT_CHAIN_ID,
    decimals: MUSD_TOKEN.decimals,
    symbol: MUSD_TOKEN.symbol,
    tokenAddress: MUSD_TOKEN_ADDRESS,
  });

  return (
    <CustomAmountInfo
      amountDetails={renderAmountDetails}
      autoFocusAmount
      currency={MONEY_ACCOUNT_DEPOSIT_CURRENCY}
      displayAccountRow
      displayPercentageButtons
      hidePayTokenAmount
    />
  );
};
