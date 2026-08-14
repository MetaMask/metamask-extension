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

export const MoneyAccountDepositInfo = () => {
  useAddToken({
    chainId: MUSD_CONVERSION_DEFAULT_CHAIN_ID,
    decimals: MUSD_TOKEN.decimals,
    symbol: MUSD_TOKEN.symbol,
    tokenAddress: MUSD_TOKEN_ADDRESS,
  });

  return (
    <CustomAmountInfo
      amountDetails={(amountFiat) => (
        <BalanceProjection
          amountFiat={amountFiat}
          projectedYears={PROJECTED_YEARS}
        />
      )}
      autoFocusAmount
      currency={MONEY_ACCOUNT_DEPOSIT_CURRENCY}
      displayAccountRow
      hasMax
      hidePayTokenAmount
    />
  );
};
