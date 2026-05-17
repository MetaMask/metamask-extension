import type { V1TransactionByHashResponse } from '@metamask/core-backend';
import { KnownCaipNamespace, toCaipChainId } from '@metamask/utils';
import { zeroAddress } from 'viem';
import { isEqualCaseInsensitive as equalsIgnoreCase } from '../../string-utils';
import type { ActivityListItem, Status } from '../types';
import { supplyMethodIds } from './constants';

// Converts indexed API transactions into the shared activity item shape
export function mapApiEvmTransactions({
  subjectAddress,
  transaction,
}: {
  subjectAddress: string;
  transaction: V1TransactionByHashResponse;
}): ActivityListItem {
  const { hash, transactionCategory, valueTransfers } = transaction;
  const status: Status = transaction.isError ? 'failed' : 'success';
  const timestamp = new Date(transaction.timestamp).getTime();
  const chainId = toCaipChainId(
    KnownCaipNamespace.Eip155,
    transaction.chainId.toString(),
  );

  const sentTransfer = valueTransfers?.find(({ from }) =>
    equalsIgnoreCase(from, subjectAddress),
  );
  const receivedTransfer = valueTransfers?.find(({ to }) =>
    equalsIgnoreCase(to, subjectAddress),
  );
  const hasSupplyMethodId =
    transaction.methodId && supplyMethodIds.has(transaction.methodId);

  if (transactionCategory === 'SWAP' || transactionCategory === 'EXCHANGE') {
    if (!receivedTransfer?.symbol) {
      return {
        type: 'swapIncomplete',
        chainId,
        status,
        timestamp,
        data: {
          sourceTokenSymbol: sentTransfer?.symbol,
          hash,
        },
      };
    }

    return {
      type: 'swap',
      chainId,
      status,
      timestamp,
      data: {
        sourceTokenSymbol: sentTransfer?.symbol,
        destinationTokenSymbol: receivedTransfer?.symbol,
        hash,
      },
    };
  }

  if (transactionCategory === 'APPROVE') {
    // TODO: Categorize REVOKE in the backend

    return {
      type: 'approveSpendingCap',
      chainId,
      status,
      timestamp,
      data: {
        hash,
        tokenSymbol: sentTransfer?.symbol ?? receivedTransfer?.symbol,
      },
    };
  }

  // TODO: Categorize NFT in the backend, sometimes TRANSFER or CONTRACT_CALL
  const isNftTransfer = valueTransfers?.some(
    ({ transferType }) =>
      transferType === 'erc721' || transferType === 'erc1155',
  );

  if (isNftTransfer) {
    if (receivedTransfer) {
      if (receivedTransfer.from === zeroAddress) {
        return {
          type: 'nftMint',
          chainId,
          status,
          timestamp,
          data: {
            hash,
            from: receivedTransfer.from,
            to: receivedTransfer.to,
            tokenSymbol: receivedTransfer?.symbol,
          },
        };
      }

      if (
        sentTransfer &&
        valueTransfers?.some((v) => v.transferType === 'normal')
      ) {
        return {
          type: 'buy',
          chainId,
          status,
          timestamp,
          data: {
            hash,
            tokenSymbol: receivedTransfer?.symbol,
          },
        };
      }

      return {
        type: 'receive',
        chainId,
        status,
        timestamp,
        data: {
          hash,
          from: receivedTransfer.from,
          to: receivedTransfer.to,
          tokenSymbol: receivedTransfer?.symbol,
        },
      };
    }

    if (sentTransfer) {
      return {
        type: 'send',
        chainId,
        status,
        timestamp,
        data: {
          hash,
          from: sentTransfer.from,
          to: sentTransfer.to,
          tokenSymbol: sentTransfer?.symbol,
        },
      };
    }
  }

  if (
    transactionCategory === 'TRANSFER' ||
    transactionCategory === 'STANDARD'
  ) {
    const isReceive =
      Boolean(receivedTransfer) ||
      (equalsIgnoreCase(transaction.to, subjectAddress) &&
        !equalsIgnoreCase(transaction.from, subjectAddress));

    const transfer = isReceive ? receivedTransfer : sentTransfer;

    // TODO: Handle mUSD converts in the backend
    // Falls back to "send" without a matching local transaction

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
        hash,
      },
    };
  }

  if (transactionCategory === 'CLAIM_BONUS') {
    return {
      type: 'claimMusdBonus',
      chainId,
      status,
      timestamp,
      data: {
        hash,
      },
    };
  }

  if (transactionCategory === 'CLAIM') {
    return {
      type: 'claim',
      chainId,
      status,
      timestamp,
      data: {
        hash,
        tokenSymbol: receivedTransfer?.symbol ?? sentTransfer?.symbol,
      },
    };
  }

  // TODO: Categorize Deposit/Stake in the backend
  if (sentTransfer && hasSupplyMethodId) {
    return {
      type: 'lendingDeposit',
      chainId,
      status,
      timestamp,
      data: {
        hash,
        tokenSymbol: sentTransfer?.symbol,
      },
    };
  }

  // TODO: Categorize these Swaps in the backend
  if (
    transactionCategory === 'CONTRACT_CALL' &&
    sentTransfer?.symbol &&
    receivedTransfer?.symbol &&
    sentTransfer.symbol !== receivedTransfer.symbol
  ) {
    return {
      type: 'swap',
      chainId,
      status,
      timestamp,
      data: {
        sourceTokenSymbol: sentTransfer.symbol,
        destinationTokenSymbol: receivedTransfer.symbol,
        hash,
      },
    };
  }

  return {
    type: 'contractInteraction',
    chainId,
    status,
    timestamp,
    data: {
      hash,
      methodId: transaction.methodId,
      from: transaction.from,
      to: transaction.to,
      transactionCategory,
      transactionProtocol: transaction.transactionProtocol,
      transactionType: transaction.transactionType,
    },
  };
}
