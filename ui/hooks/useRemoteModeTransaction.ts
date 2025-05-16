import { TransactionMeta } from '@metamask/transaction-controller';
import { getSelectedInternalAccount } from '../selectors';
import { useSelector } from 'react-redux';
import { isRemoteModeSupported } from '../helpers/utils/remote-mode';
import { getIsRemoteModeEnabled } from '../selectors/remote-mode';
import { useMemo } from 'react';

export const useRemoteModeTransaction = ({
  transaction,
}: {
  transaction: TransactionMeta;
}) => {
  const selectedInternalAccount = useSelector(getSelectedInternalAccount);
  const isAccountRemoteModeSupported = isRemoteModeSupported(
    selectedInternalAccount,
  );
  const isRemoteModeEnabled = useSelector(getIsRemoteModeEnabled);

  const isRemoteModeTransaction = useMemo(() => {
    if (!isRemoteModeEnabled || !isAccountRemoteModeSupported) {
      return false;
    }
    return (
      transaction.txParamsOriginal?.from === selectedInternalAccount.address
    );
  }, [
    isAccountRemoteModeSupported,
    isRemoteModeEnabled,
    transaction,
    selectedInternalAccount.address,
  ]);

  const isRemoteModeGasTransaction = useMemo(() => {
    if (!isRemoteModeEnabled) {
      return false;
    }
    const hasTxParamsOriginal = transaction.txParamsOriginal !== undefined;
    const isHotWallet =
      transaction.txParamsOriginal?.from !== selectedInternalAccount.address &&
      transaction.txParams?.from === selectedInternalAccount.address;
    return hasTxParamsOriginal && isHotWallet;
  }, [isRemoteModeEnabled, transaction, selectedInternalAccount.address]);

  return {
    isRemoteModeTransaction,
    isRemoteModeGasTransaction,
  };
};
