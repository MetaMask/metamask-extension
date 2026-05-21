import React from 'react';
import { useSelector } from 'react-redux';
import type { V1TransactionByHashResponse } from '@metamask/core-backend';
import type { ActivityListItem } from '../../../shared/lib/activity/types';
import {
  normalizeTransaction,
  parseValueTransfers,
} from '../../../shared/lib/multichain/transformations';
import { ActivityDetailsModalAdapter } from '../../components/multichain/activity-v2/activity-details-modal-adapter';
import { LocalTransactionDetails } from '../../components/multichain/activity-v2/local-transaction-details';
import { NonEvmDetailsModal } from '../../components/multichain/activity-v2/non-evm-details-modal';
import { getSelectedAddress } from '../../selectors/selectors';

function getAccountAddress(transaction: V1TransactionByHashResponse) {
  const parts = transaction.accountId?.split(':');
  return parts?.[parts.length - 1] ?? transaction.from;
}

function toTransactionViewModel(transaction: V1TransactionByHashResponse) {
  const accountAddress = getAccountAddress(transaction);
  const normalizedTransaction = normalizeTransaction(
    accountAddress,
    transaction,
  );

  return {
    ...normalizedTransaction,
    readable: transaction.readable,
    nonce: transaction.nonce,
    amounts: parseValueTransfers(accountAddress, transaction),
    transactionType: transaction.transactionType,
    transactionCategory: transaction.transactionCategory,
    transactionProtocol: transaction.transactionProtocol,
    valueTransfers: transaction.valueTransfers,
  };
}

export function LegacyDetails({
  item,
  onClose,
}: {
  item: ActivityListItem | null;
  onClose: () => void;
}) {
  const selectedAddress = useSelector(getSelectedAddress);
  const raw = item?.raw;

  if (!raw) {
    return null;
  }

  if (raw.type === 'keyringTransaction') {
    return <NonEvmDetailsModal transaction={raw.data} onClose={onClose} />;
  }

  if (raw.type === 'localTransaction') {
    return (
      <LocalTransactionDetails transactionGroup={raw.data} onClose={onClose} />
    );
  }

  const transaction = toTransactionViewModel({
    ...raw.data,
    accountId:
      raw.data.accountId ??
      `eip155:${raw.data.chainId}:${selectedAddress ?? raw.data.from}`,
  });

  return (
    <ActivityDetailsModalAdapter
      isOpen
      onClose={onClose}
      transaction={transaction}
    />
  );
}
