import type { V1TransactionByHashResponse } from '@metamask/core-backend';
import { KnownCaipNamespace, toCaipChainId } from '@metamask/utils';
import { isEqualCaseInsensitive } from '../../string-utils';
import type { ActivityListItem, Status } from '../types';
import { supplyMethodIds } from './constants';

export function mapMultiAccountTransaction({
  subjectAddress,
  transaction,
}: {
  subjectAddress: string;
  transaction: V1TransactionByHashResponse;
}): ActivityListItem {
  const chainId = toCaipChainId(
    KnownCaipNamespace.Eip155,
    transaction.chainId.toString(),
  );
  const status: Status = transaction.isError ? 'failed' : 'success';
  const timestamp = new Date(transaction.timestamp).getTime();
  const sentTransfer = transaction.valueTransfers?.find(({ from }) =>
    isEqualCaseInsensitive(from, subjectAddress),
  );
  const receivedTransfer = transaction.valueTransfers?.find(({ to }) =>
    isEqualCaseInsensitive(to, subjectAddress),
  );
  const hasSupplyMethodId =
    transaction.methodId && supplyMethodIds.has(transaction.methodId);

  if (
    transaction.transactionCategory === 'SWAP' ||
    transaction.transactionCategory === 'EXCHANGE'
  ) {
    return {
      type: 'swap',
      chainId,
      status,
      timestamp,
      data: {
        destinationTokenSymbol: receivedTransfer?.symbol,
        hash: transaction.hash,
        sourceTokenSymbol: sentTransfer?.symbol,
      },
    };
  }

  if (sentTransfer && hasSupplyMethodId) {
    return {
      type: 'lendingDeposit',
      chainId,
      status,
      timestamp,
      data: {
        hash: transaction.hash,
        tokenSymbol: sentTransfer?.symbol,
      },
    };
  }

  if (transaction.transactionCategory === 'APPROVE') {
    return {
      type: 'approveSpendingCap',
      chainId,
      status,
      timestamp,
      data: {
        hash: transaction.hash,
        tokenSymbol: sentTransfer?.symbol ?? receivedTransfer?.symbol,
      },
    };
  }

  if (
    transaction.transactionCategory === 'CLAIM_BONUS' ||
    transaction.transactionType === 'METAMASK_CLAIM_BONUS'
  ) {
    return {
      type: 'claimMusdBonus',
      chainId,
      status,
      timestamp,
      data: {
        hash: transaction.hash,
      },
    };
  }

  if (transaction.transactionCategory === 'CLAIM') {
    return {
      type: 'claim',
      chainId,
      status,
      timestamp,
      data: {
        hash: transaction.hash,
        tokenSymbol: receivedTransfer?.symbol ?? sentTransfer?.symbol,
      },
    };
  }

  if (
    transaction.transactionCategory === 'TRANSFER' ||
    transaction.transactionCategory === 'STANDARD'
  ) {
    const isReceive =
      Boolean(receivedTransfer) ||
      (isEqualCaseInsensitive(transaction.to, subjectAddress) &&
        !isEqualCaseInsensitive(transaction.from, subjectAddress));

    const transfer = isReceive ? receivedTransfer : sentTransfer;

    return {
      type: isReceive ? 'receive' : 'send',
      chainId,
      status,
      timestamp,
      data: {
        from: transfer?.from ?? transaction.from,
        to: transfer?.to ?? transaction.to,
        tokenSymbol: isReceive
          ? receivedTransfer?.symbol
          : sentTransfer?.symbol,
        hash: transaction.hash,
      },
    };
  }

  return {
    type: 'contractInteraction',
    chainId,
    status,
    timestamp,
    data: {
      from: transaction.from,
      methodId: transaction.methodId,
      to: transaction.to,
      transactionCategory: transaction.transactionCategory,
      transactionProtocol: transaction.transactionProtocol,
      transactionType: transaction.transactionType,
      hash: transaction.hash,
    },
  };
}
