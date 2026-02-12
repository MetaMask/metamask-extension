import React, { useMemo } from 'react';
import type {
  TransactionViewModel,
  TransactionGroup,
} from '../../../../shared/acme-controller/types';
import { TransactionDetailsModal } from '../../../pages/confirmations/components/activity';
import { PAY_TRANSACTION_TYPES } from '../../../pages/confirmations/constants/pay';
import { useTransactionDisplayData } from '../../../hooks/useTransactionDisplayData';
import { getStatusKey } from '../../../helpers/utils/transactions.util';
import { formatDateWithYearContext } from '../../../helpers/utils/util';
import TransactionListItemDetails from '../../app/transaction-list-item-details';
import TransactionStatusLabel from '../../app/transaction-status-label/transaction-status-label';

function buildSyntheticTransactionGroup(
  transaction: TransactionViewModel,
): TransactionGroup {
  const rawNonce = transaction.txParams?.nonce;
  const nonce: `0x${string}` =
    typeof rawNonce === 'string'
      ? (rawNonce as `0x${string}`)
      : `0x${Number(rawNonce ?? 0).toString(16)}`;
  return {
    initialTransaction: transaction,
    primaryTransaction: transaction,
    transactions: [transaction],
    nonce,
    hasCancelled: false,
    hasRetried: false,
  };
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionViewModel | null;
};

// Interim: Adapter so we can use legacy modals until we fully migrate to new UI
export const ActivityDetailsModalAdapter = ({
  isOpen,
  onClose,
  transaction,
}: Props) => {
  if (!isOpen || !transaction) {
    return null;
  }

  return (
    <ActivityDetailsModalAdapterContent
      transaction={transaction}
      onClose={onClose}
    />
  );
};

const ActivityDetailsModalAdapterContent = ({
  transaction,
  onClose,
}: {
  transaction: TransactionViewModel;
  onClose: () => void;
}) => {
  const syntheticGroup = useMemo(
    () => buildSyntheticTransactionGroup(transaction),
    [transaction],
  );
  const displayData = useTransactionDisplayData(syntheticGroup);

  const isPayType =
    transaction.type !== undefined &&
    PAY_TRANSACTION_TYPES.includes(transaction.type);

  if (isPayType) {
    return (
      <TransactionDetailsModal
        transactionMeta={transaction}
        onClose={onClose}
      />
    );
  }

  const { title, primaryCurrency, recipientAddress } = displayData;
  const senderAddress = transaction.txParams?.from ?? '';
  const displayedStatusKey = getStatusKey(
    transaction as Parameters<typeof getStatusKey>[0],
  );
  const date = formatDateWithYearContext(
    transaction.time ?? 0,
    'MMM d, y',
    'MMM d',
  );
  const chainId =
    typeof transaction.chainId === 'string'
      ? transaction.chainId
      : `0x${Number(transaction.chainId).toString(16)}`;

  return (
    <TransactionListItemDetails
      title={title}
      onClose={onClose}
      transactionGroup={syntheticGroup}
      primaryCurrency={primaryCurrency}
      senderAddress={senderAddress}
      recipientAddress={recipientAddress}
      onRetry={() => {}}
      showSpeedUp={false}
      isEarliestNonce={false}
      onCancel={() => {}}
      transactionStatus={() => (
        <TransactionStatusLabel
          isEarliestNonce={false}
          error={undefined}
          date={date}
          status={displayedStatusKey}
          statusOnly
        />
      )}
      chainId={chainId}
    />
  );
};
