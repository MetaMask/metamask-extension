import type { V1TransactionByHashResponse } from '@metamask/core-backend';
import type { ActivityListItem, Status } from '../types';

export function mapMultiAccountTransaction({
  subjectAddress,
  transaction,
}: {
  subjectAddress: string;
  transaction: V1TransactionByHashResponse;
}): ActivityListItem {
  const address = subjectAddress.toLowerCase();
  const chainId = `eip155:${transaction.chainId}` as const;
  const status: Status = transaction.isError ? 'failed' : 'success';
  const timestamp = new Date(transaction.timestamp).getTime();
  const sentTransfer = transaction.valueTransfers?.find(
    ({ from }) => from?.toLowerCase() === address,
  );
  const receivedTransfer = transaction.valueTransfers?.find(
    ({ to }) => to?.toLowerCase() === address,
  );

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
        sourceTokenSymbol: sentTransfer?.symbol,
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
        tokenSymbol: sentTransfer?.symbol ?? receivedTransfer?.symbol,
      },
    };
  }

  if (
    transaction.transactionCategory === 'TRANSFER' ||
    transaction.transactionCategory === 'STANDARD'
  ) {
    const isReceive =
      Boolean(receivedTransfer) ||
      (transaction.to?.toLowerCase() === address &&
        transaction.from?.toLowerCase() !== address);

    return {
      type: isReceive ? 'receive' : 'send',
      chainId,
      status,
      timestamp,
      data: {
        from: transaction.from,
        to: transaction.to,
        tokenSymbol: isReceive
          ? receivedTransfer?.symbol
          : sentTransfer?.symbol,
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
    },
  };
}
