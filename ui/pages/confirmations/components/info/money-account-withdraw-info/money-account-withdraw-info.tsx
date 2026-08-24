import React from 'react';
import { CHAIN_IDS } from '../../../../../../shared/constants/network';
import { useAddToken } from '../../../hooks/tokens/useAddToken';
import { useTransactionPayWithdraw } from '../../../hooks/pay/useTransactionPayWithdraw';
import { MUSD_TOKEN, MUSD_TOKEN_ADDRESS } from '../../../constants/musd';
import { CustomAmountInfo } from '../custom-amount-info';
import { MoneyAccountWithdrawBalance } from '../../money-account-confirmations/money-account-withdraw-balance';
import { useMoneyAccountBalance } from '../../../../../hooks/money/useMoneyAccountBalance';
import { RouteMessengerProvider } from '../../../../../contexts/route-messenger';
import { MONEY_ACCOUNT_BALANCE_ALLOWED_CAPABILITIES } from '../../money-account-confirmations/messenger';

const MONEY_ACCOUNT_WITHDRAW_CURRENCY = 'usd';

const MONEY_ACCOUNT_WITHDRAW_PREFERRED_TOKEN = {
  address: MUSD_TOKEN_ADDRESS,
  chainId: CHAIN_IDS.MONAD,
};

/**
 * Money-account withdraw confirmation info content.
 *
 * Mirrors mobile `MoneyAccountWithdrawInfo`: USD custom amount, optional
 * receive-token selection (post-quote allowlist), destination account row,
 * and the vault withdrawable balance as the max / available-balance source.
 * Default receive token is mUSD on Monad.
 *
 * Wrapped by {@link MoneyAccountWithdrawInfo} in a route messenger because
 * both the balance override and the subtitle read `useMoneyAccountBalance`.
 *
 * @returns The withdraw custom-amount screen.
 */
const MoneyAccountWithdrawInfoContent = () => {
  useAddToken({
    chainId: CHAIN_IDS.MONAD,
    decimals: MUSD_TOKEN.decimals,
    symbol: MUSD_TOKEN.symbol,
    tokenAddress: MUSD_TOKEN_ADDRESS,
  });

  const { canSelectWithdrawToken } = useTransactionPayWithdraw();
  const { withdrawableFiatRaw } = useMoneyAccountBalance();
  const availableBalance = Number(withdrawableFiatRaw) || 0;

  return (
    <CustomAmountInfo
      autoFocusAmount
      balanceUsdOverride={availableBalance}
      currency={MONEY_ACCOUNT_WITHDRAW_CURRENCY}
      disablePay={!canSelectWithdrawToken}
      displayAccountRow
      displayPercentageButtons
      hidePayTokenAmount
      preferredToken={MONEY_ACCOUNT_WITHDRAW_PREFERRED_TOKEN}
    >
      <MoneyAccountWithdrawBalance />
    </CustomAmountInfo>
  );
};

/**
 * {@link MoneyAccountWithdrawInfoContent} wrapped in the route messenger that
 * `useMoneyAccountBalance` needs for the availability gate.
 *
 * @returns The withdraw custom-amount screen.
 */
export const MoneyAccountWithdrawInfo = () => (
  <RouteMessengerProvider
    path="money-account-withdraw-info"
    capabilities={MONEY_ACCOUNT_BALANCE_ALLOWED_CAPABILITIES}
  >
    <MoneyAccountWithdrawInfoContent />
  </RouteMessengerProvider>
);
