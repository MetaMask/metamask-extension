import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { BigNumber } from 'bignumber.js';
import {
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { PaymentOverride } from '@metamask/transaction-pay-controller';
import { hasTransactionType } from '../../../../../shared/lib/transactions.utils';
import { useMoneyAccountWithdrawableFiat } from '../../../../hooks/money/useMoneyAccountWithdrawableFiat';
import { useIsHardwareWalletAccount } from '../../../../hooks/useIsHardwareWalletAccount';
import { selectPrimaryMoneyAccount } from '../../../../selectors/money-account';
import {
  selectPaymentOverrideByTransactionId,
  type TransactionPayState,
} from '../../../../selectors/transactionPayController';
import { useConfirmContext } from '../../context/confirm';
import {
  selectIsMoneyAccountTransactionEnabled,
  selectMinimumRequiredTokenBalance,
  selectPreferredPayTokens,
} from '../../selectors/feature-flags';
import type { Asset } from '../../types/send';
import { applyMoneyAccountOverride } from '../../utils/transaction-pay';

/**
 * Deposit flows whose Pay-with default can fall through to Money Account
 * when it is the better funding source.
 *
 * Deposit-and-order types are omitted. Extension has no Money Account pay
 * path for them; mobile selects those from the order views.
 */
const MONEY_ACCOUNT_BALANCE_DEFAULT_TYPES: TransactionType[] = [
  TransactionType.perpsDeposit,
  TransactionType.predictDeposit,
];

/**
 * Auto-selects Money Account for Perps and Predict deposits when it is the
 * best funding source.
 *
 * A token that has the highest balance and is on the preferred-token list
 * wins. Otherwise Money Account wins when its balance is higher than every
 * token, or when the highest token is not preferred and Money Account meets
 * the same minimum balance configured for preferred tokens.
 *
 * @param options - Hook options.
 * @param options.availableTokens - Funding tokens already visible to Pay with.
 * @param options.disable - When true, leaves the current pay method alone.
 * @param options.payTokenSelected - When true, an explicit pay token is
 * already chosen and must not be replaced.
 * @returns Whether the balance is still loading, and whether Money Account
 * should become the pay method once it resolves.
 */
export function useAutomaticMoneyAccountPayToken({
  availableTokens,
  disable = false,
  payTokenSelected,
}: {
  availableTokens: Asset[];
  disable?: boolean;
  payTokenSelected: boolean;
}): { isPending: boolean; shouldSelect: boolean } {
  const isUpdated = useRef<string | undefined>(undefined);
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const transactionId = currentConfirmation?.id;
  const from = currentConfirmation?.txParams?.from;
  const isHardwareWallet = useIsHardwareWalletAccount(from);

  const paymentOverride = useSelector((state: TransactionPayState) =>
    selectPaymentOverrideByTransactionId(state, transactionId ?? ''),
  );
  const moneyAccount = useSelector(selectPrimaryMoneyAccount);
  const transactionType = MONEY_ACCOUNT_BALANCE_DEFAULT_TYPES.find((type) =>
    hasTransactionType(currentConfirmation, [type]),
  );
  const preferredTokens = useSelector((state) =>
    selectPreferredPayTokens(state, transactionType),
  );
  const minimumRequiredTokenBalance = useSelector(
    selectMinimumRequiredTokenBalance,
  );
  const isMoneyAccountPayEnabled = useSelector((state) =>
    selectIsMoneyAccountTransactionEnabled(state, transactionType),
  );

  const canUseMoneyAccountPay =
    !disable &&
    !isHardwareWallet &&
    paymentOverride !== PaymentOverride.MoneyAccount &&
    Boolean(transactionType) &&
    isMoneyAccountPayEnabled;

  const { isLoading, withdrawableFiatRaw } = useMoneyAccountWithdrawableFiat(
    canUseMoneyAccountPay,
  );
  const withdrawableBalance = toFiatBalance(withdrawableFiatRaw);
  const highestBalanceToken = getHighestBalanceToken(availableTokens);
  // bignumber.js 4 throws on JS numbers with more than 15 significant digits,
  // which fiat balances often have, so compare through strings.
  const highestTokenBalance = new BigNumber(
    String(highestBalanceToken?.fiat?.balance ?? 0),
  );
  const isHighestBalanceTokenPreferred = Boolean(
    highestBalanceToken &&
    preferredTokens.some((token) => isSamePayToken(highestBalanceToken, token)),
  );
  const isPending = canUseMoneyAccountPay && isLoading;
  const shouldSelect = Boolean(
    canUseMoneyAccountPay &&
    withdrawableBalance?.greaterThan(0) &&
    (withdrawableBalance.greaterThan(highestTokenBalance) ||
      (!isHighestBalanceTokenPreferred &&
        withdrawableBalance.greaterThanOrEqualTo(
          new BigNumber(String(minimumRequiredTokenBalance)),
        ))),
  );

  useEffect(() => {
    if (
      !canUseMoneyAccountPay ||
      payTokenSelected ||
      !transactionId ||
      isUpdated.current === transactionId ||
      isPending ||
      !shouldSelect
    ) {
      return;
    }

    applyMoneyAccountOverride(
      transactionId,
      moneyAccount?.address,
      currentConfirmation,
    );
    isUpdated.current = transactionId;
  }, [
    canUseMoneyAccountPay,
    currentConfirmation,
    isPending,
    moneyAccount?.address,
    payTokenSelected,
    shouldSelect,
    transactionId,
  ]);

  return { isPending, shouldSelect };
}

function getHighestBalanceToken(tokens: Asset[]): Asset | undefined {
  return tokens.reduce<Asset | undefined>((highest, token) => {
    if (token.disabled) {
      return highest;
    }

    if ((token.fiat?.balance ?? 0) > (highest?.fiat?.balance ?? -1)) {
      return token;
    }

    return highest;
  }, undefined);
}

function isSamePayToken(
  token: Asset,
  preferred: { address: string; chainId: string },
): boolean {
  if (!token.address || token.chainId === undefined) {
    return false;
  }

  return (
    token.address.toLowerCase() === preferred.address.toLowerCase() &&
    String(token.chainId).toLowerCase() === preferred.chainId.toLowerCase()
  );
}

function toFiatBalance(value: string | undefined): BigNumber | undefined {
  if (value === undefined) {
    return undefined;
  }

  const balance = new BigNumber(value);
  return balance.isFinite() ? balance : undefined;
}
