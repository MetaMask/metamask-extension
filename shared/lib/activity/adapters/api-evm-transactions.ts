import type { V1TransactionByHashResponse } from '@metamask/core-backend';
import { KnownCaipNamespace, toCaipChainId } from '@metamask/utils';
import { NATIVE_TOKEN_ADDRESS as zeroAddress } from '../../../constants/transaction';
import { isEqualCaseInsensitive as equalsIgnoreCase } from '../../string-utils';
import type { ActivityListItem, Status, TokenAmount } from '../types';
import { supplyMethodIds } from './constants';
import {
  getTokenMetadataFromKnownToken,
  getTokenAmountFromTransfer,
  withFallbackTokenAssetId,
  type ValueTransfer,
} from './helpers';

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
  const getToken = (
    transfer: ValueTransfer | undefined,
    direction: TokenAmount['direction'],
  ) => getTokenAmountFromTransfer(transfer, direction, chainId);

  const sentTransfer = valueTransfers?.find(({ from }) =>
    equalsIgnoreCase(from, subjectAddress),
  );
  const receivedTransfer = valueTransfers?.find(({ to }) =>
    equalsIgnoreCase(to, subjectAddress),
  );
  const sentNftTransfer = valueTransfers?.find(
    ({ from, transferType }) =>
      equalsIgnoreCase(from, subjectAddress) &&
      (transferType === 'erc721' || transferType === 'erc1155'),
  );
  const receivedNftTransfer = valueTransfers?.find(
    ({ to, transferType }) =>
      equalsIgnoreCase(to, subjectAddress) &&
      (transferType === 'erc721' || transferType === 'erc1155'),
  );
  const sentNativeTransfer = valueTransfers?.find(
    ({ from, transferType }) =>
      equalsIgnoreCase(from, subjectAddress) && transferType === 'normal',
  );
  const hasNativeTransferWithoutMethod =
    transactionCategory === 'CONTRACT_CALL' &&
    !transaction.methodId &&
    valueTransfers?.some(({ transferType }) => transferType === 'normal');
  const hasSupplyMethodId =
    transaction.methodId && supplyMethodIds.has(transaction.methodId);
  if (transactionCategory === 'SWAP' || transactionCategory === 'EXCHANGE') {
    if (!receivedTransfer?.symbol) {
      return {
        type: 'swapIncomplete',
        chainId,
        status,
        timestamp,
        raw: { type: 'apiEvmTransaction', data: transaction },
        data: {
          sourceToken: getToken(sentTransfer, 'out'),
          hash,
        },
      };
    }

    return {
      type: 'swap',
      chainId,
      status,
      timestamp,
      raw: { type: 'apiEvmTransaction', data: transaction },
      data: {
        sourceToken: getToken(sentTransfer, 'out'),
        destinationToken: getToken(receivedTransfer, 'in'),
        hash,
      },
    };
  }

  if (transactionCategory === 'APPROVE') {
    // TODO: Categorize REVOKE in the backend
    const approveTransfer = sentTransfer ?? receivedTransfer;
    const approveDirection = receivedTransfer && !sentTransfer ? 'in' : 'out';
    const approveToken =
      getToken(approveTransfer, approveDirection) ??
      getTokenMetadataFromKnownToken(transaction.to, approveDirection, chainId);

    return {
      type: 'approveSpendingCap',
      chainId,
      status,
      timestamp,
      raw: { type: 'apiEvmTransaction', data: transaction },
      data: {
        hash,
        token: approveToken,
      },
    };
  }

  // TODO: Categorize NFT in the backend, sometimes TRANSFER or CONTRACT_CALL
  if (sentNftTransfer || receivedNftTransfer) {
    if (receivedNftTransfer) {
      if (receivedNftTransfer.from === zeroAddress) {
        return {
          type: 'nftMint',
          chainId,
          status,
          timestamp,
          raw: { type: 'apiEvmTransaction', data: transaction },
          data: {
            hash,
            from: receivedNftTransfer.from,
            to: receivedNftTransfer.to,
            token: getToken(receivedNftTransfer, 'in'),
          },
        };
      }

      if (sentNativeTransfer) {
        return {
          type: 'buy',
          chainId,
          status,
          timestamp,
          raw: { type: 'apiEvmTransaction', data: transaction },
          data: {
            hash,
            token: getToken(receivedNftTransfer, 'in'),
          },
        };
      }

      return {
        type: 'receive',
        chainId,
        status,
        timestamp,
        raw: { type: 'apiEvmTransaction', data: transaction },
        data: {
          hash,
          from: receivedNftTransfer.from,
          to: receivedNftTransfer.to,
          token: getToken(receivedNftTransfer, 'in'),
        },
      };
    }

    if (sentNftTransfer) {
      return {
        type: 'send',
        chainId,
        status,
        timestamp,
        raw: { type: 'apiEvmTransaction', data: transaction },
        data: {
          hash,
          from: sentNftTransfer.from,
          to: sentNftTransfer.to,
          token: getToken(sentNftTransfer, 'out'),
        },
      };
    }
  }

  if (
    transactionCategory === 'TRANSFER' ||
    transactionCategory === 'STANDARD' ||
    hasNativeTransferWithoutMethod
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
      raw: { type: 'apiEvmTransaction', data: transaction },
      data: {
        from: transfer?.from ?? transaction.from,
        to: transfer?.to ?? transaction.to,
        token: withFallbackTokenAssetId(
          getToken(transfer, isReceive ? 'in' : 'out'),
          transaction.to,
          transfer?.transferType,
          chainId,
        ),
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
      raw: { type: 'apiEvmTransaction', data: transaction },
      data: {
        hash,
        token: getToken(receivedTransfer, 'in'),
      },
    };
  }

  if (transactionCategory === 'CLAIM') {
    return {
      type: 'claim',
      chainId,
      status,
      timestamp,
      raw: { type: 'apiEvmTransaction', data: transaction },
      data: {
        hash,
        token: getToken(
          receivedTransfer ?? sentTransfer,
          receivedTransfer ? 'in' : 'out',
        ),
      },
    };
  }

  if (transactionCategory === 'WITHDRAW') {
    return {
      type: 'lendingWithdrawal',
      chainId,
      status,
      timestamp,
      raw: { type: 'apiEvmTransaction', data: transaction },
      data: {
        hash,
        sourceToken: getToken(sentTransfer, 'out'),
        destinationToken: getToken(receivedTransfer, 'in'),
      },
    };
  }

  if (transactionCategory === 'BRIDGE_WITHDRAW') {
    return {
      type: 'bridge',
      chainId,
      status,
      timestamp,
      raw: { type: 'apiEvmTransaction', data: transaction },
      data: {
        hash,
        sourceToken: getToken(sentTransfer, 'out'),
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
      raw: { type: 'apiEvmTransaction', data: transaction },
      data: {
        hash,
        sourceToken: getToken(sentTransfer, 'out'),
        destinationToken: getToken(receivedTransfer, 'in'),
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
      raw: { type: 'apiEvmTransaction', data: transaction },
      data: {
        sourceToken: getToken(sentTransfer, 'out'),
        destinationToken: getToken(receivedTransfer, 'in'),
        hash,
      },
    };
  }

  // TODO: Not sure if this is specific enough, may need separate category in backend
  if (
    transactionCategory === 'DEPOSIT' &&
    receivedTransfer &&
    !hasSupplyMethodId
  ) {
    return {
      type: 'wrap',
      chainId,
      status,
      timestamp,
      raw: { type: 'apiEvmTransaction', data: transaction },
      data: {
        hash,
        sourceToken: getToken(sentTransfer, 'out'),
        destinationToken: getToken(receivedTransfer, 'in'),
      },
    };
  }
  if (transactionCategory === 'UNWRAP') {
    return {
      type: 'unwrap',
      chainId,
      status,
      timestamp,
      raw: { type: 'apiEvmTransaction', data: transaction },
      data: {
        hash,
        sourceToken: getToken(sentTransfer, 'out'),
        destinationToken: getToken(receivedTransfer, 'in'),
      },
    };
  }

  if (transactionCategory === 'DEPOSIT') {
    return {
      type: 'deposit',
      chainId,
      status,
      timestamp,
      raw: { type: 'apiEvmTransaction', data: transaction },
      data: {
        hash,
        token: getToken(sentTransfer, 'in'),
      },
    };
  }

  return {
    type: 'contractInteraction',
    chainId,
    status,
    timestamp,
    raw: { type: 'apiEvmTransaction', data: transaction },
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
