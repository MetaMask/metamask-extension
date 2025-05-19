import { TransactionMeta } from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import { getSelectedInternalAccount } from '../selectors';
import { REDEEM_DELEGATIONS_SELECTOR } from '../../shared/lib/delegation/delegation';

export const useRemoteModeTransaction = ({
  transaction,
}: {
  transaction: TransactionMeta;
}) => {
  const selectedInternalAccount = useSelector(getSelectedInternalAccount);

  const isRemoteModeTransaction = useMemo(() => {
    return (
      transaction.txParams.data?.startsWith(REDEEM_DELEGATIONS_SELECTOR) &&
      transaction.txParamsOriginal?.from !== transaction.txParams.from &&
      transaction.txParamsOriginal?.from === selectedInternalAccount.address
    );
  }, [transaction, selectedInternalAccount.address]);

  const isRemoteModeGasTransaction = useMemo(() => {
    const hasTxParamsOriginal = transaction.txParamsOriginal !== undefined;
    const isHotWallet =
      transaction.txParamsOriginal?.from !== selectedInternalAccount.address &&
      transaction.txParams?.from === selectedInternalAccount.address;
    return hasTxParamsOriginal && isHotWallet;
  }, [transaction, selectedInternalAccount.address]);

  return {
    isRemoteModeTransaction,
    isRemoteModeGasTransaction,
  };
};
