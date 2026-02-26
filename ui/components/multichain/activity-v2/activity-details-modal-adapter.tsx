import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { TransactionType } from '@metamask/transaction-controller';
import { toHex } from '@metamask/controller-utils';
import { Hex } from 'viem';
import type {
  TransactionViewModel,
  TransactionGroup,
} from '../../../../shared/lib/multichain/types';
import { TransactionDetailsModal as LegacyTransactionDetailsModal } from '../../../pages/confirmations/components/activity';
import { PAY_TRANSACTION_TYPES } from '../../../pages/confirmations/constants/pay';
import { useTransactionDisplayData } from '../../../hooks/useTransactionDisplayData';
import { getStatusKey } from '../../../helpers/utils/transactions.util';
import { formatDateWithYearContext } from '../../../helpers/utils/util';
import LegacyTransactionListItemDetails from '../../app/transaction-list-item-details';
import TransactionStatusLabel from '../../app/transaction-status-label/transaction-status-label';
import { getSelectedAddress } from '../../../selectors/selectors';
import { formatUnits } from '../../../../shared/lib/unit';
import { useGetTitle } from './hooks';

// eslint-disable-next-line no-empty-function
const noop = () => {};

// Map API transactionCategory to TransactionType for legacy modal
function resolveTransactionType(tx: TransactionViewModel): TransactionType {
  const { transactionCategory, transactionType } = tx;

  if (transactionCategory === 'APPROVE') {
    return TransactionType.tokenMethodApprove;
  }
  if (
    transactionCategory === 'BRIDGE_OUT' ||
    transactionCategory === 'BRIDGE_IN'
  ) {
    return TransactionType.bridge;
  }

  if (transactionCategory === 'SWAP' || transactionCategory === 'EXCHANGE') {
    return TransactionType.swap;
  }

  // Specifics from transactionType
  if (transactionType === 'DEPLOY_CONTRACT') {
    return TransactionType.deployContract;
  }

  if (transactionType === 'ERC_20_TRANSFER') {
    return TransactionType.tokenMethodTransfer;
  }

  if (
    transactionType === 'ERC_721_TRANSFER' ||
    transactionType === 'ERC_1155_TRANSFER'
  ) {
    return TransactionType.tokenMethodTransferFrom;
  }

  if (transactionCategory === 'TRANSFER') {
    if (tx.amounts?.to && !tx.amounts?.from) {
      return TransactionType.incoming;
    }
    if (tx.amounts?.from) {
      return TransactionType.simpleSend;
    }
  }

  return TransactionType.contractInteraction;
}

// Build synthetic transaction group for legacy modal
function buildSyntheticTransactionGroup(
  transaction: TransactionViewModel,
  selectedAddress?: string,
): TransactionGroup {
  const rawNonce = transaction.txParams?.nonce;
  const nonce =
    typeof rawNonce === 'string' && rawNonce.startsWith('0x')
      ? (rawNonce as Hex)
      : (toHex(rawNonce ?? 0) as Hex);
  const from = transaction.txParams?.from?.toLowerCase();
  const to = transaction.txParams?.to?.toLowerCase();
  const user = selectedAddress?.toLowerCase();
  const isIncoming = user && to === user && from !== user;
  const effectiveType = isIncoming
    ? TransactionType.incoming
    : resolveTransactionType(transaction);
  // Enrich with sourceToken/destinationToken fields that the legacy
  // bridge/swap display code reads from initialTransaction
  const fromAmount = transaction.amounts?.from;
  const toAmount = transaction.amounts?.to;
  const sourceTokenSymbol =
    transaction.sourceTokenSymbol ?? fromAmount?.token.symbol;
  const sourceTokenAddress =
    transaction.sourceTokenAddress ?? fromAmount?.token.address;
  const sourceTokenAmount =
    transaction.sourceTokenAmount ??
    (fromAmount
      ? formatUnits(
          fromAmount.amount < 0n ? -fromAmount.amount : fromAmount.amount,
          fromAmount.token.decimals,
        )
      : undefined);
  const destinationTokenSymbol =
    transaction.destinationTokenSymbol ?? toAmount?.token.symbol;

  const txWithType = {
    ...transaction,
    type: effectiveType,
    sourceTokenSymbol,
    sourceTokenAddress,
    sourceTokenAmount,
    destinationTokenSymbol,
  };

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

const TransactionDetailsWrapper = ({
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
  const title = useGetTitle(transaction);

  const from = transaction.txParams?.from?.toLowerCase();
  const to = transaction.txParams?.to?.toLowerCase();
  const user = selectedAddress?.toLowerCase();
  const isIncoming = Boolean(user && to === user && from !== user);
  const effectiveType = isIncoming
    ? TransactionType.incoming
    : resolveTransactionType(transaction);

  // Ported from transaction-list-item.component
  if (PAY_TRANSACTION_TYPES.includes(effectiveType)) {
    return (
      <LegacyTransactionDetailsModal
        transactionMeta={transaction}
        onClose={onClose}
      />
    );
  }

  const { primaryCurrency, recipientAddress } = displayData;

  let resolvedPrimaryCurrency = primaryCurrency;
  if (effectiveType === TransactionType.swap && transaction.amounts?.from) {
    const { token, amount } = transaction.amounts.from;
    const abs = amount < 0n ? -amount : amount;
    const formatted = formatUnits(abs, token.decimals);
    resolvedPrimaryCurrency = `-${formatted} ${token.symbol}`;
  }

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
      : toHex(transaction.chainId);

  return (
    <LegacyTransactionListItemDetails
      title={title}
      onClose={onClose}
      transactionGroup={syntheticGroup}
      primaryCurrency={resolvedPrimaryCurrency}
      senderAddress={senderAddress}
      recipientAddress={recipientAddress}
      onRetry={noop}
      showSpeedUp={false}
      isEarliestNonce={false}
      onCancel={noop}
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

// Interim: Adapter so we can use legacy modals
// until we fully migrate to the redesigned modals
export const ActivityDetailsModalAdapter = ({
  isOpen,
  onClose,
  transaction,
}: Props) => {
  if (!isOpen || !transaction) {
    return null;
  }

  return (
    <TransactionDetailsWrapper transaction={transaction} onClose={onClose} />
  );
};
