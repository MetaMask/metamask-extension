import React, { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
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
import { selectTransactionByHash } from '../../../selectors/transactionController';
import { formatUnits } from '../../../../shared/lib/unit';
import { useBridgeActivityData } from '../../../hooks/bridge/useBridgeActivityData';
import { useGetTitle } from './hooks';
import { resolveTransactionType } from './helpers';

// eslint-disable-next-line no-empty-function
const noop = () => {};

// Build synthetic transaction group for legacy modal
function buildSyntheticTransactionGroup(
  transaction: TransactionViewModel,
  selectedAddress?: string,
  localTransactionMeta?: TransactionMeta,
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
    // Surface local TransactionController fields (revert reasons, error) onto
    // the synthetic primary transaction so legacy details components — e.g.
    // the "protected by enforced simulations" banner — can read them. The
    // Accounts API view model doesn't carry these fields.
    revert: localTransactionMeta?.revert ?? transaction.revert,
    error: localTransactionMeta?.error ?? transaction.error,
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
  const localTransactionMeta = useSelector((state) =>
    selectTransactionByHash(state, transaction.hash),
  );
  const syntheticGroup = useMemo(
    () =>
      buildSyntheticTransactionGroup(
        transaction,
        selectedAddress,
        localTransactionMeta,
      ),
    [transaction, selectedAddress, localTransactionMeta],
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

  const { showBridgeTxDetails } = useBridgeActivityData({
    transaction,
  });
  // Navigate to the Unified Swap/Bridge Tx Details page if the selected
  // EVMtransaction is a bridge or swap
  useEffect(() => {
    if (showBridgeTxDetails) {
      onClose();
      showBridgeTxDetails();
    }
  }, [showBridgeTxDetails]);

  // Ported from transaction-list-item.component
  if (PAY_TRANSACTION_TYPES.includes(effectiveType)) {
    return (
      <LegacyTransactionDetailsModal
        transactionMeta={syntheticGroup.initialTransaction}
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
      transactionStatus={() => {
        const primary = syntheticGroup.primaryTransaction;
        const failureMessage =
          displayedStatusKey === 'failed'
            ? primary.error?.message ?? primary.revert?.receipt?.message
            : undefined;
        return (
          <TransactionStatusLabel
            isEarliestNonce={false}
            error={failureMessage ? { message: failureMessage } : undefined}
            date={date}
            status={displayedStatusKey}
            statusOnly
          />
        );
      }}
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
