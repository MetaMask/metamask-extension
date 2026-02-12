import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { TransactionType } from '@metamask/transaction-controller';
import type {
  TransactionViewModel,
  TransactionGroup,
} from '../../../../shared/acme-controller/types';
import { TransactionDetailsModal } from '../../../pages/confirmations/components/activity';
import { PAY_TRANSACTION_TYPES } from '../../../pages/confirmations/constants/pay';
import { useTransactionDisplayData } from '../../../hooks/useTransactionDisplayData';
import { getStatusKey } from '../../../helpers/utils/transactions.util';
import { formatDateWithYearContext } from '../../../helpers/utils/util';
import { useI18nContext } from '../../../hooks/useI18nContext';
import TransactionListItemDetails from '../../app/transaction-list-item-details';
import TransactionStatusLabel from '../../app/transaction-status-label/transaction-status-label';
import { getSelectedAddress } from '../../../selectors/selectors';

/** Map API transactionType (from queries) to TransactionType so legacy modal title is correct. */
function apiTransactionTypeToTransactionType(
  transactionType?: string,
): TransactionType {
  switch (transactionType) {
    case 'INCOMING':
      return TransactionType.incoming;
    case 'ERC_20_APPROVE':
    case 'ERC_721_APPROVE':
    case 'ERC_1155_APPROVE':
      return TransactionType.tokenMethodApprove;
    case 'ERC_20_TRANSFER':
      return TransactionType.tokenMethodTransfer;
    case 'ERC_721_TRANSFER':
    case 'ERC_1155_TRANSFER':
      return TransactionType.tokenMethodTransferFrom;
    case 'METAMASK_V1_EXCHANGE':
      return TransactionType.swap;
    case 'METAMASK_BRIDGE_V2_BRIDGE_OUT':
    case 'METAMASK_BRIDGE_V2_BRIDGE_IN':
      return TransactionType.bridge;
    case 'CONTRACT_INTERACTION':
      return TransactionType.contractInteraction;
    case 'DEPLOY_CONTRACT':
      return TransactionType.deployContract;
    default:
      return TransactionType.simpleSend;
  }
}

/** Build synthetic group with type overridden so useTransactionDisplayData shows correct title. Uses API transactionType and direction (incoming = to user's wallet). */
function buildSyntheticTransactionGroup(
  transaction: TransactionViewModel,
  selectedAddress?: string,
): TransactionGroup {
  const rawNonce = transaction.txParams?.nonce;
  const nonce: `0x${string}` =
    typeof rawNonce === 'string'
      ? (rawNonce as `0x${string}`)
      : `0x${Number(rawNonce ?? 0).toString(16)}`;
  const from = transaction.txParams?.from?.toLowerCase();
  const to = transaction.txParams?.to?.toLowerCase();
  const user = selectedAddress?.toLowerCase();
  const isIncoming =
    user && to === user && from !== user;
  const effectiveType = isIncoming
    ? TransactionType.incoming
    : apiTransactionTypeToTransactionType(transaction.transactionType);
  const txWithType = { ...transaction, type: effectiveType };
  return {
    initialTransaction: txWithType,
    primaryTransaction: txWithType,
    transactions: [txWithType],
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
  const selectedAddress = useSelector(getSelectedAddress);
  const syntheticGroup = useMemo(
    () => buildSyntheticTransactionGroup(transaction, selectedAddress),
    [transaction, selectedAddress],
  );
  const displayData = useTransactionDisplayData(syntheticGroup);

  const from = transaction.txParams?.from?.toLowerCase();
  const to = transaction.txParams?.to?.toLowerCase();
  const user = selectedAddress?.toLowerCase();
  const isIncoming = Boolean(user && to === user && from !== user);
  const effectiveType = isIncoming
    ? TransactionType.incoming
    : apiTransactionTypeToTransactionType(transaction.transactionType);
  const isPayType = PAY_TRANSACTION_TYPES.includes(effectiveType);

  if (isPayType) {
    return (
      <TransactionDetailsModal
        transactionMeta={transaction}
        onClose={onClose}
      />
    );
  }

  const { title, primaryCurrency, recipientAddress } = displayData;
  const t = useI18nContext();
  const modalTitle =
    effectiveType === TransactionType.swap ? t('swap') : title;
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
      title={modalTitle}
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
