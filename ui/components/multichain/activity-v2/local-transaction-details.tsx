import React, { useEffect } from 'react';
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import type { TransactionGroup } from '../../../../shared/lib/multichain/types';
import { TransactionDetailsModal } from '../../../pages/confirmations/components/activity';
import { PAY_TRANSACTION_TYPES } from '../../../pages/confirmations/constants/pay';
import { resolveTransactionType } from '../../app/transaction-list-item/helpers';
import LegacyTransactionListItemDetails from '../../app/transaction-list-item-details';
import TransactionStatusLabel from '../../app/transaction-status-label/transaction-status-label';
import { useBridgeTxHistoryData } from '../../../hooks/bridge/useBridgeTxHistoryData';
import { useTransactionDisplayData } from '../../../hooks/useTransactionDisplayData';
import { getStatusKey } from '../../../helpers/utils/transactions.util';

const noop = () => undefined;

type LocalTransactionDetailsProps = {
  transactionGroup: TransactionGroup;
  onClose: () => void;
};

export const LocalTransactionDetails = ({
  transactionGroup,
  onClose,
}: Readonly<LocalTransactionDetailsProps>) => {
  const { initialTransaction, primaryTransaction } = transactionGroup;
  const { isBridgeFailed, showBridgeTxDetails } = useBridgeTxHistoryData({
    transactionGroup,
  });
  const { primaryCurrency, recipientAddress, title } =
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
          isEarliestNonce={false}
          error={primaryTransaction.error}
          status={displayedStatusKey}
        />
      )}
      chainId={initialTransaction.chainId}
    />
  );
};
