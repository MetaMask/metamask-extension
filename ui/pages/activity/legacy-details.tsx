import React from 'react';
import { useSelector } from 'react-redux';
import { TransactionType } from '@metamask/transaction-controller';
import type { V1TransactionByHashResponse } from '@metamask/core-backend';
import { Navigate } from 'react-router-dom';
import type { ActivityListItem } from '../../../shared/lib/activity/types';
import {
  normalizeTransaction,
  parseValueTransfers,
} from '../../../shared/lib/multichain/transformations';
import { ActivityDetailsModalAdapter } from '../../components/multichain/activity-v2/activity-details-modal-adapter';
import { LocalTransactionDetails } from '../../components/multichain/activity-v2/local-transaction-details';
import { NonEvmDetailsModal } from '../../components/multichain/activity-v2/non-evm-details-modal';
import { CROSS_CHAIN_SWAP_TX_DETAILS_ROUTE } from '../../helpers/constants/routes';
import { serialize } from '../../hooks/bridge/useBridgeTxHistoryData';
import { getSelectedAddress } from '../../selectors/selectors';

type ActivityEvmTransaction = V1TransactionByHashResponse & {
  accountId?: string;
  readable?: string;
};

function getAccountAddress(transaction: ActivityEvmTransaction) {
  const parts = transaction.accountId?.split(':');
  return parts?.[parts.length - 1] ?? transaction.from;
}

function toTransactionViewModel(transaction: ActivityEvmTransaction) {
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
    const { initialTransaction, primaryTransaction } = raw.data;

    if (
      initialTransaction.type === TransactionType.bridge ||
      initialTransaction.type === TransactionType.swap
    ) {
      const txIdentifier =
        primaryTransaction.hash ??
        initialTransaction.hash ??
        primaryTransaction.id ??
        initialTransaction.id;

      if (txIdentifier) {
        return (
          <Navigate
            to={`${CROSS_CHAIN_SWAP_TX_DETAILS_ROUTE}/${txIdentifier}`}
            state={{ transaction: serialize(primaryTransaction) }}
          />
        );
      }
    }

    return (
      <LocalTransactionDetails transactionGroup={raw.data} onClose={onClose} />
    );
  }

  const rawTransaction = raw.data as ActivityEvmTransaction;
  const transaction = toTransactionViewModel({
    ...rawTransaction,
    accountId:
      rawTransaction.accountId ??
      `eip155:${rawTransaction.chainId}:${
        selectedAddress ?? rawTransaction.from
      }`,
  });

  return (
    <ActivityDetailsModalAdapter
      isOpen
      onClose={onClose}
      transaction={transaction}
    />
  );
}
