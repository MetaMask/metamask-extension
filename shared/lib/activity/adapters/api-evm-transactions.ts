import type { V1TransactionByHashResponse } from '@metamask/core-backend';
import { KnownCaipNamespace, toCaipChainId } from '@metamask/utils';
import { NATIVE_TOKEN_ADDRESS as zeroAddress } from '../../../constants/transaction';
import { toAssetId } from '../../asset-utils';
import { isValidHexAddress } from '../../hexstring-utils';
import { isEqualCaseInsensitive as equalsIgnoreCase } from '../../string-utils';
import type { ActivityListItem, Status, TokenAmount } from '../types';
import { supplyMethodIds, withdrawMethodIds, wrapMethodIds } from './constants';
import {
  getFees,
  getNativeAssetSafe,
  getNftPaymentTransfer,
  getTokenMetadataFromKnownToken,
  getTokenAmountFromTransfer,
  parseValueTransfers,
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
  const { hash, transactionCategory, valueTransfers, from } = transaction;
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

  const {
    sentTransfer,
    receivedTransfer,
    sentNativeTransfer,
    sentNftTransfer,
    receivedNftTransfer,
  } = parseValueTransfers(valueTransfers, subjectAddress);

  const hasNativeTransferWithoutMethod =
    transactionCategory === 'CONTRACT_CALL' &&
    !transaction.methodId &&
    valueTransfers?.some(({ transferType }) => transferType === 'normal');
  const hasSupplyMethodId =
    transaction.methodId && supplyMethodIds.has(transaction.methodId);
  const hasWithdrawMethodId =
    transaction.methodId && withdrawMethodIds.has(transaction.methodId);
  const hasWrapMethodId =
    transaction.methodId && wrapMethodIds.has(transaction.methodId);

  if (transactionCategory === 'SWAP' || transactionCategory === 'EXCHANGE') {
    if (!receivedTransfer?.symbol) {
      return {
        type: 'swapIncomplete',
        chainId,
        status,
        timestamp,
        hash,
        data: {
          sourceToken: getToken(sentTransfer, 'out'),
          from,
        },
      };
    }

    return {
      type: 'swap',
      chainId,
      status,
      timestamp,
      hash,
      data: {
        sourceToken: getToken(sentTransfer, 'out'),
        destinationToken: getToken(receivedTransfer, 'in'),
        fees: getFees(transaction, chainId),
        from,
      },
    };
  }

  if (transactionCategory === 'APPROVE') {
    // TODO: Categorize REVOKE in the backend
    const direction = receivedTransfer && !sentTransfer ? 'in' : 'out';
    const valueTransferContractAddress = valueTransfers?.find(
      ({ contractAddress, transferType }) =>
        contractAddress &&
        transferType !== 'normal' &&
        transferType !== 'internal',
    )?.contractAddress;
    const contractAddress =
      (isValidHexAddress(transaction.to, { allowNonPrefixed: false })
        ? transaction.to
        : undefined) ??
      (valueTransferContractAddress &&
      isValidHexAddress(valueTransferContractAddress, {
        allowNonPrefixed: false,
      })
        ? valueTransferContractAddress
        : undefined);
    const assetId = contractAddress
      ? toAssetId(contractAddress, chainId)
      : undefined;
    const token =
      getTokenMetadataFromKnownToken(contractAddress, direction, chainId) ??
      (assetId ? { direction, assetId } : undefined);

    return {
      type: 'approveSpendingCap',
      chainId,
      status,
      timestamp,
      hash,
      data: {
        from,
        token,
        fees: getFees(transaction, chainId),
      },
    };
  }

  const isNftExchange = transactionCategory === 'NFT_EXCHANGE';

  // TODO: Categorize NFT in the backend, sometimes TRANSFER or CONTRACT_CALL
  if (sentNftTransfer || receivedNftTransfer) {
    if (receivedNftTransfer) {
      if (receivedNftTransfer.from === zeroAddress) {
        return {
          type: 'nftMint',
          chainId,
          status,
          timestamp,
          hash,
          data: {
            from: receivedNftTransfer.from,
            to: receivedNftTransfer.to,
            token: getToken(receivedNftTransfer, 'in'),
          },
        };
      }

      const purchasePaymentTransfer = getNftPaymentTransfer({
        side: 'buy',
        sentTransfer,
        sentNativeTransfer,
        nftCounterparty: receivedNftTransfer.from,
        subjectAddress,
      });

      // API category, or outgoing payment to the seller / in native ETH.
      if (isNftExchange || purchasePaymentTransfer) {
        return {
          type: 'nftBuy',
          chainId,
          status,
          timestamp,
          hash,
          data: {
            from: receivedNftTransfer.from,
            to: receivedNftTransfer.to,
            token: getToken(receivedNftTransfer, 'in'),
            paymentToken: getToken(purchasePaymentTransfer, 'out'),
          },
        };
      }

      return {
        type: 'receive',
        chainId,
        status,
        timestamp,
        hash,
        data: {
          from: receivedNftTransfer.from,
          to: receivedNftTransfer.to,
          token: getToken(receivedNftTransfer, 'in'),
        },
      };
    }

    if (sentNftTransfer) {
      const saleProceedsTransfer = getNftPaymentTransfer({
        side: 'sell',
        receivedTransfer,
        nftCounterparty: sentNftTransfer.to,
        transactionFrom: from,
        subjectAddress,
      });

      // API category, or incoming payment from the buyer.
      if (isNftExchange || saleProceedsTransfer) {
        return {
          type: 'nftSell',
          chainId,
          status,
          timestamp,
          hash,
          data: {
            from: sentNftTransfer.from,
            to: sentNftTransfer.to,
            token: getToken(sentNftTransfer, 'out'),
            paymentToken: getToken(saleProceedsTransfer, 'in'),
          },
        };
      }

      return {
        type: 'send',
        chainId,
        status,
        timestamp,
        hash,
        data: {
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
      Boolean(receivedTransfer && !sentTransfer) ||
      (equalsIgnoreCase(transaction.to, subjectAddress) &&
        !equalsIgnoreCase(from, subjectAddress));

    const transfer = isReceive ? receivedTransfer : sentTransfer;
    const direction = isReceive ? 'in' : 'out';
    const nativeAsset = getNativeAssetSafe(chainId);
    const nativeToken =
      transactionCategory === 'STANDARD' && nativeAsset
        ? ({
            ...nativeAsset,
            amount: transaction.value,
            direction,
          } as TokenAmount)
        : undefined;

    // TODO: Handle mUSD converts in the backend
    // Falls back to "send" without a matching local transaction

    return {
      type: isReceive ? 'receive' : 'send',
      chainId,
      status,
      timestamp,
      hash,
      data: {
        from: transfer?.from ?? from,
        to: transfer?.to ?? transaction.to,
        token:
          withFallbackTokenAssetId(
            getToken(transfer, direction),
            transaction.to,
            transfer?.transferType,
            chainId,
          ) ?? nativeToken,
        fees: getFees(transaction, chainId),
      },
    };
  }

  if (transactionCategory === 'CLAIM_BONUS') {
    return {
      type: 'claimMusdBonus',
      chainId,
      status,
      timestamp,
      hash,
      data: {
        from,
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
      hash,
      data: {
        from,
        token: getToken(
          receivedTransfer ?? sentTransfer,
          receivedTransfer ? 'in' : 'out',
        ),
      },
    };
  }

  if (transactionCategory === 'BRIDGE_WITHDRAW') {
    return {
      type: 'bridge',
      chainId,
      status,
      timestamp,
      hash,
      data: {
        sourceToken: getToken(sentTransfer, 'out'),
        from,
        fees: getFees(transaction, chainId),
      },
    };
  }

  // lending withdrawal - applies to Earn features only
  if (transactionCategory === 'WITHDRAW' && hasWithdrawMethodId) {
    return {
      type: 'lendingWithdrawal',
      chainId,
      status,
      timestamp,
      hash,
      data: {
        sourceToken: getToken(sentTransfer, 'out'),
        destinationToken: getToken(receivedTransfer, 'in'),
        fees: getFees(transaction, chainId),
        from,
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
      hash,
      data: {
        sourceToken: getToken(sentTransfer, 'out'),
        destinationToken: getToken(receivedTransfer, 'in'),
        fees: getFees(transaction, chainId),
        from,
      },
    };
  }

  // TODO: Not sure if this is specific enough, may need separate category in backend
  if (receivedTransfer && hasWrapMethodId) {
    return {
      type: 'wrap',
      chainId,
      status,
      timestamp,
      hash,
      data: {
        sourceToken: getToken(sentTransfer, 'out'),
        destinationToken: getToken(receivedTransfer, 'in'),
        fees: getFees(transaction, chainId),
        from,
      },
    };
  }
  if (transactionCategory === 'UNWRAP') {
    return {
      type: 'unwrap',
      chainId,
      status,
      timestamp,
      hash,
      data: {
        sourceToken: getToken(sentTransfer, 'out'),
        destinationToken: getToken(receivedTransfer, 'in'),
        fees: getFees(transaction, chainId),
        from,
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
      hash,
      data: {
        sourceToken: getToken(sentTransfer, 'out'),
        destinationToken: getToken(receivedTransfer, 'in'),
        fees: getFees(transaction, chainId),
        from,
      },
    };
  }

  if (transactionCategory === 'DEPOSIT') {
    return {
      type: 'deposit',
      chainId,
      status,
      timestamp,
      hash,
      data: {
        from,
        token: getToken(sentTransfer, 'out'),
      },
    };
  }

  const contractInteractionTransfer = sentTransfer ?? receivedTransfer;
  const contractInteractionToken = getToken(
    contractInteractionTransfer,
    sentTransfer ? 'out' : 'in',
  );
  const contractInteractionTokenWithAmount = contractInteractionToken?.amount
    ? contractInteractionToken
    : undefined;

  return {
    type: 'contractInteraction',
    chainId,
    status,
    timestamp,
    hash,
    data: {
      methodId: transaction.methodId,
      from,
      to: transaction.to,
      transactionCategory,
      transactionProtocol: transaction.transactionProtocol,
      transactionType: transaction.transactionType,
      ...(contractInteractionTokenWithAmount
        ? { token: contractInteractionTokenWithAmount }
        : {}),
    },
  };
}
