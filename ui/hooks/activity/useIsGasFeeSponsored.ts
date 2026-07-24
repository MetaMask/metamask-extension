import { useSelector } from 'react-redux';
import { isTransactionGroupGasFeeSponsored } from '../../../shared/lib/transaction-gas-fee.utils';
import { isHardwareWallet } from '../../../shared/lib/selectors/keyring';
import { selectLocalTransactionsByHash } from '../../selectors/activity';

export function useIsGasFeeSponsored(hash: string | undefined): boolean {
  const isHardwareWalletAccount = useSelector(isHardwareWallet);
  const localTransactionsByHash = useSelector(selectLocalTransactionsByHash);
  const transactionGroup = hash
    ? localTransactionsByHash.get(hash.toLowerCase())
    : undefined;

  if (!transactionGroup) {
    return false;
  }

  return isTransactionGroupGasFeeSponsored({
    transactionGroup,
    isHardwareWalletAccount,
  });
}
