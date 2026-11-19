import { useSelector } from 'react-redux';
import { isTransactionGasFeeSponsored } from '../../../shared/lib/transaction-gas-fee.utils';
import { isHardwareWallet } from '../../../shared/lib/selectors/keyring';
import { selectLocalTransactionsByHash } from '../../selectors/activity';

export function useIsGasFeeSponsored(hash: string | undefined) {
  const isHardwareWalletAccount = useSelector(isHardwareWallet);
  const localTransactionsByHash = useSelector(selectLocalTransactionsByHash);
  const transactionGroup = hash
    ? localTransactionsByHash.get(hash.toLowerCase())
    : undefined;

  if (!transactionGroup) {
    return false;
  }

  const { initialTransaction, primaryTransaction } = transactionGroup;
  const transaction =
    primaryTransaction.isGasFeeSponsored || !initialTransaction
      ? primaryTransaction
      : initialTransaction;

  return isTransactionGasFeeSponsored({
    transaction,
    isHardwareWalletAccount,
  });
}
