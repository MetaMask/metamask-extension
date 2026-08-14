import { TransactionType } from '@metamask/transaction-controller';
import { hasTransactionType } from '../../../../../shared/lib/transactions.utils';
import { useTransactionMetadataRequest } from '../transactions/useTransactionMetadataRequest';
import { usePayWithNoFeeToken } from './usePayWithNoFeeToken';
import { useTransactionPayToken } from './useTransactionPayToken';

const MONEY_ACCOUNT_TRANSACTION_TYPES: TransactionType[] = [
  TransactionType.moneyAccountDeposit,
  TransactionType.moneyAccountWithdraw,
];

/**
 * Whether the selected pay token is a no-fee (subsidised) source for a money
 * account deposit or withdraw. Matches mobile `useMoneyNoFeeTokens`.
 */
export function useMoneyNoFeeTokens(): { isMoneyNoFeeToken: boolean } {
  const transactionMeta = useTransactionMetadataRequest();
  const { payToken } = useTransactionPayToken();
  const { isNoFeeToken } = usePayWithNoFeeToken();

  const isMoneyAccountTransaction = hasTransactionType(
    transactionMeta,
    MONEY_ACCOUNT_TRANSACTION_TYPES,
  );

  if (!isMoneyAccountTransaction || !payToken) {
    return { isMoneyNoFeeToken: false };
  }

  return {
    isMoneyNoFeeToken: isNoFeeToken(payToken.address, String(payToken.chainId)),
  };
}
