import React from 'react';
import { CHAIN_IDS } from '../../../../../../../shared/constants/network';
import { useAddToken } from '../../../../hooks/tokens/useAddToken';
import { useTransactionPayPostQuote } from '../../../../hooks/pay/useTransactionPayPostQuote';
import { useTransactionPayWithdraw } from '../../../../hooks/pay/useTransactionPayWithdraw';
import { CustomAmountInfo } from '../../../info/custom-amount-info';
import { MUSD_TOKEN, MUSD_TOKEN_ADDRESS } from '../../../../constants/musd';

const MONEY_ACCOUNT_WITHDRAW_CURRENCY = 'usd';

const MONEY_ACCOUNT_WITHDRAW_PREFERRED_TOKEN = {
  address: MUSD_TOKEN_ADDRESS,
  chainId: CHAIN_IDS.MONAD,
};

/**
 * Money-account withdraw confirmation info.
 *
 * Mirrors mobile `MoneyAccountWithdrawInfo`: USD custom amount, optional
 * receive-token selection (post-quote allowlist), and destination account row.
 * Default receive token is mUSD on Monad.
 */
export const MoneyAccountWithdrawInfo = () => {
  useAddToken({
    chainId: CHAIN_IDS.MONAD,
    decimals: MUSD_TOKEN.decimals,
    symbol: MUSD_TOKEN.symbol,
    tokenAddress: MUSD_TOKEN_ADDRESS,
  });

  useTransactionPayPostQuote();

  const { canSelectWithdrawToken } = useTransactionPayWithdraw();

  return (
    <CustomAmountInfo
      autoFocusAmount
      currency={MONEY_ACCOUNT_WITHDRAW_CURRENCY}
      disablePay={!canSelectWithdrawToken}
      displayAccountRow
      hidePayTokenAmount
      preferredToken={MONEY_ACCOUNT_WITHDRAW_PREFERRED_TOKEN}
    />
  );
};
