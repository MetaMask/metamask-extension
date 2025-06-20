import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import { getSelectedInternalAccount } from '../selectors';
import { REDEEM_DELEGATIONS_SELECTOR } from '../../shared/lib/delegation/delegation';

const SUPPORTED_TRANSACTION_TYPES = [
  TransactionType.simpleSend,
  TransactionType.tokenMethodTransfer,
];

export const useRemoteModeTransaction = ({
  transaction,
}: {
  transaction: TransactionMeta;
}) => {
  const selectedInternalAccount = useSelector(getSelectedInternalAccount);

  const isRemoteModeTransaction = useMemo(() => {
    if (!transaction.txParams) {
      return false;
    }
    const isSupportedTransactionType = transaction.type
      ? SUPPORTED_TRANSACTION_TYPES.includes(transaction.type)
      : false;
    const isRedeemDelegationsCall = transaction.txParams.data?.startsWith(
      REDEEM_DELEGATIONS_SELECTOR,
    );
    const isFromChanged =
      transaction.txParamsOriginal?.from !== transaction.txParams.from;
    const isOriginalFromSelected =
      transaction.txParamsOriginal?.from === selectedInternalAccount.address;

    return (
      isSupportedTransactionType &&
      isRedeemDelegationsCall &&
      isFromChanged &&
      isOriginalFromSelected
    );
  }, [transaction, selectedInternalAccount.address]);

  const isRemoteModeGasTransaction = useMemo(() => {
    const isSupportedTransactionType = transaction.type
      ? SUPPORTED_TRANSACTION_TYPES.includes(transaction.type)
      : false;
    const hasTxParamsOriginal = transaction.txParamsOriginal !== undefined;
    const isHotWallet =
      transaction.txParamsOriginal?.from !== selectedInternalAccount.address &&
      transaction.txParams?.from === selectedInternalAccount.address;
    return isSupportedTransactionType && hasTxParamsOriginal && isHotWallet;
  }, [transaction, selectedInternalAccount.address]);

  return {
    isRemoteModeTransaction,
    isRemoteModeGasTransaction,
    isRemoteModeActivity: isRemoteModeTransaction || isRemoteModeGasTransaction,
  };
};
