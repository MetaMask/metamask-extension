import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import type { V1TransactionByHashResponse } from '@metamask/core-backend';
import type { ActivityListItem } from '../../../shared/lib/activity/types';
import {
  normalizeTransaction,
  parseValueTransfers,
} from '../../../shared/lib/multichain/transformations';
import type { TransactionGroup } from '../../../shared/lib/multichain/types';
import { ActivityDetailsModalAdapter } from '../../components/multichain/activity-v2/activity-details-modal-adapter';
import { NonEvmDetailsModal } from '../../components/multichain/activity-v2/non-evm-details-modal';
import LegacyTransactionListItemDetails from '../../components/app/transaction-list-item-details';
import TransactionStatusLabel from '../../components/app/transaction-status-label/transaction-status-label';
import { resolveTransactionType } from '../../components/app/transaction-list-item/helpers';
import { PAY_TRANSACTION_TYPES } from '../confirmations/constants/pay';
import { TransactionDetailsModal } from '../confirmations/components/activity';
import { useTransactionDisplayData } from '../../hooks/useTransactionDisplayData';
import { useBridgeTxHistoryData } from '../../hooks/bridge/useBridgeTxHistoryData';
import { getStatusKey } from '../../helpers/utils/transactions.util';
import { formatDateWithYearContext } from '../../helpers/utils/util';
import { getSelectedAddress } from '../../selectors/selectors';

const noop = () => undefined;

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

function LocalTransactionDetails({
  transactionGroup,
  onClose,
}: {
  transactionGroup: TransactionGroup;
  onClose: () => void;
}) {
  const { initialTransaction, primaryTransaction } = transactionGroup;
  const { isBridgeFailed, showBridgeTxDetails } = useBridgeTxHistoryData({
    transactionGroup,
  });
  const { isPending, primaryCurrency, recipientAddress, title } =
    useTransactionDisplayData(transactionGroup);

  useEffect(() => {
    if (
      initialTransaction.type === TransactionType.bridge &&
      showBridgeTxDetails
    ) {
      onClose();
      showBridgeTxDetails();
    }
  }, [initialTransaction.type, onClose, showBridgeTxDetails]);

  if (
    initialTransaction.type === TransactionType.bridge &&
    showBridgeTxDetails
  ) {
    return null;
  }

  const resolvedType = resolveTransactionType(
    initialTransaction.type,
    initialTransaction.txParams?.to,
    initialTransaction.txParams?.data,
  );

  if (resolvedType && PAY_TRANSACTION_TYPES.includes(resolvedType)) {
    return (
      <TransactionDetailsModal
        transactionMeta={initialTransaction}
        onClose={onClose}
      />
    );
  }

  const displayedStatusKey =
    initialTransaction.type === TransactionType.bridge && isBridgeFailed
      ? TransactionStatus.failed
      : getStatusKey(primaryTransaction);
  const date = formatDateWithYearContext(
    primaryTransaction.time ?? 0,
    'MMM d, y',
    'MMM d',
  );

  return (
    <LegacyTransactionListItemDetails
      title={title}
      onClose={onClose}
      transactionGroup={transactionGroup}
      primaryCurrency={primaryCurrency}
      senderAddress={initialTransaction.txParams?.from ?? ''}
      recipientAddress={recipientAddress}
      onRetry={noop}
      showSpeedUp={false}
      isEarliestNonce={false}
      onCancel={noop}
      transactionStatus={() => (
        <TransactionStatusLabel
          isPending={isPending}
          isEarliestNonce={false}
          error={primaryTransaction.error}
          date={date}
          status={displayedStatusKey}
          statusOnly
        />
      )}
      chainId={initialTransaction.chainId}
    />
  );
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
