import { TransactionType } from '@metamask/transaction-controller';
import { getNativeAssetForChainId } from '@metamask/bridge-controller';
import { KnownCaipNamespace, toCaipChainId } from '@metamask/utils';
import { toAssetId } from '../../asset-utils';
import type { TransactionGroup } from '../../multichain/types';
import { parseStandardTokenTransactionData } from '../../transaction.utils';
import type { ActivityListItem, TokenAmount } from '../types';
import { getLocalTransactionStatus, getMainnetTokenMetadata } from './helpers';

// Converts local TransactionController groups into activity items
export function mapLocalTransaction(
  transactionGroup: TransactionGroup & {
    sourceToken?: TokenAmount;
    destinationToken?: TokenAmount;
    nativeAssetSymbol?: string;
    contractTokenMetadata?: { symbol?: string; decimals?: number };
  },
): ActivityListItem {
  const { initialTransaction, primaryTransaction } = transactionGroup;
  const chainId = toCaipChainId(
    KnownCaipNamespace.Eip155,
    Number.parseInt(initialTransaction.chainId, 16).toString(),
  );
  const nativeAsset = getNativeAssetForChainId(initialTransaction.chainId);
  // Prefer the network-configured ticker (resolved by the selector from
  // NetworkController state) over the bridge-controller swaps registry,
  // which hard-codes synthetic symbols like `TESTETH` for chains such as
  // Localhost (0x539) regardless of how the user configured the network.
  const nativeSymbol =
    transactionGroup.nativeAssetSymbol ?? nativeAsset?.symbol;

  const getNativeToken = (
    transaction: TransactionGroup['initialTransaction'],
    direction: TokenAmount['direction'],
  ) => {
    if (nativeSymbol === undefined) {
      return undefined;
    }

    return {
      direction,
      symbol: nativeSymbol,
      ...(transaction.txParams.value
        ? { amount: transaction.txParams.value }
        : {}),
      ...(nativeAsset?.assetId ? { assetId: nativeAsset.assetId } : {}),
      ...(nativeAsset?.decimals === undefined
        ? {}
        : { decimals: nativeAsset.decimals }),
    };
  };

  const getContractToken = ({
    amount,
    contractAddress,
    direction,
    transaction,
  }: {
    amount?: string;
    contractAddress?: string;
    direction: TokenAmount['direction'];
    transaction: TransactionGroup['initialTransaction'];
  }) => {
    if (contractAddress === undefined) {
      return undefined;
    }

    const tokenMetadata = getMainnetTokenMetadata(
      transaction.chainId,
      contractAddress,
    );
    const decimals =
      transaction.transferInformation?.amount === undefined
        ? (tokenMetadata?.decimals ??
          transactionGroup.contractTokenMetadata?.decimals)
        : transaction.transferInformation.decimals;
    const tokenAmount = transaction.transferInformation?.amount ?? amount;
    const symbol =
      transaction.transferInformation?.symbol ??
      tokenMetadata?.symbol ??
      transactionGroup.contractTokenMetadata?.symbol;
    const assetId = toAssetId(contractAddress, chainId);

    return {
      direction,
      ...(symbol ? { symbol } : {}),
      ...(assetId ? { assetId } : {}),
      ...(tokenAmount ? { amount: tokenAmount } : {}),
      ...(decimals === undefined ? {} : { decimals }),
    };
  };

  const getLegacySwapToken = (direction: TokenAmount['direction']) => {
    const key = direction === 'out' ? 'token_from' : 'token_to';
    const initialSwapMetaDataSymbol = initialTransaction.swapMetaData?.[key];
    const primarySwapMetaDataSymbol = primaryTransaction.swapMetaData?.[key];
    const initialTokenSymbol =
      typeof initialSwapMetaDataSymbol === 'string'
        ? initialSwapMetaDataSymbol
        : undefined;
    const primaryTokenSymbol =
      typeof primarySwapMetaDataSymbol === 'string'
        ? primarySwapMetaDataSymbol
        : undefined;
    const { value } = initialTransaction.txParams;
    let hasNativeValue = false;

    if (value !== undefined && value !== '') {
      try {
        hasNativeValue = BigInt(value) > 0n;
      } catch {
        hasNativeValue = false;
      }
    }

    let symbol =
      initialTransaction.destinationTokenSymbol ??
      primaryTransaction.destinationTokenSymbol ??
      initialTokenSymbol ??
      primaryTokenSymbol;

    if (direction === 'out') {
      symbol =
        initialTransaction.sourceTokenSymbol ??
        primaryTransaction.sourceTokenSymbol ??
        initialTokenSymbol ??
        primaryTokenSymbol ??
        (hasNativeValue ? nativeSymbol : undefined);
    }

    if (symbol === undefined) {
      return undefined;
    }

    return {
      direction,
      symbol,
      ...(symbol === nativeSymbol && nativeAsset?.assetId
        ? { assetId: nativeAsset.assetId }
        : {}),
    };
  };

  const status = getLocalTransactionStatus({
    primaryTransaction,
    initialTransaction,
  });
  const timestamp = primaryTransaction.time ?? initialTransaction.time;
  const hash =
    primaryTransaction.hash ?? initialTransaction.hash ?? primaryTransaction.id;
  const from = initialTransaction.txParams.from ?? '';
  const to = initialTransaction.txParams.to ?? '';

  switch (initialTransaction.type) {
    case TransactionType.simpleSend: {
      return {
        type: 'send',
        chainId,
        status,
        timestamp,
        raw: { type: 'localTransaction', data: transactionGroup },
        data: {
          hash,
          from,
          to,
          token: getNativeToken(initialTransaction, 'out'),
        },
      };
    }

    case TransactionType.tokenMethodSafeTransferFrom:
    case TransactionType.tokenMethodTransfer:
    case TransactionType.tokenMethodTransferFrom: {
      const transactionData = initialTransaction.txParams.data
        ? parseStandardTokenTransactionData(initialTransaction.txParams.data)
        : undefined;
      const recipient = transactionData?.args?._to ?? transactionData?.args?.to;
      const amount =
        transactionData?.args?._value ?? transactionData?.args?.value;

      return {
        type: 'send',
        chainId,
        status,
        timestamp,
        raw: { type: 'localTransaction', data: transactionGroup },
        data: {
          hash,
          from,
          to: typeof recipient === 'string' ? recipient : to,
          token: getContractToken({
            amount: amount?.toString(),
            transaction: initialTransaction,
            direction: 'out',
            contractAddress: initialTransaction.txParams.to,
          }),
        },
      };
    }

    case TransactionType.incoming: {
      return {
        type: 'receive',
        chainId,
        status,
        timestamp,
        raw: { type: 'localTransaction', data: transactionGroup },
        data: {
          hash,
          from,
          to,
          token: initialTransaction.transferInformation?.contractAddress
            ? getContractToken({
                transaction: initialTransaction,
                direction: 'in',
                contractAddress:
                  initialTransaction.transferInformation.contractAddress,
              })
            : getNativeToken(initialTransaction, 'in'),
        },
      };
    }

    case TransactionType.swap:
    case TransactionType.swapAndSend: {
      const {
        sourceToken: enrichedSourceToken,
        destinationToken: enrichedDestinationToken,
      } = transactionGroup;
      const sourceToken = enrichedSourceToken ?? getLegacySwapToken('out');
      const destinationToken =
        enrichedDestinationToken ?? getLegacySwapToken('in');

      if (destinationToken?.symbol === undefined) {
        return {
          type: 'swapIncomplete',
          chainId,
          status,
          timestamp,
          raw: { type: 'localTransaction', data: transactionGroup },
          data: {
            hash,
            sourceToken,
          },
        };
      }

      return {
        type: 'swap',
        chainId,
        status,
        timestamp,
        raw: { type: 'localTransaction', data: transactionGroup },
        data: {
          hash,
          sourceToken,
          destinationToken,
        },
      };
    }

    case TransactionType.bridgeApproval:
    case TransactionType.shieldSubscriptionApprove:
    case TransactionType.swapApproval:
    case TransactionType.tokenMethodApprove:
    case TransactionType.tokenMethodSetApprovalForAll:
      return {
        type: 'approveSpendingCap',
        chainId,
        status,
        timestamp,
        raw: { type: 'localTransaction', data: transactionGroup },
        data: {
          hash,
          token: getContractToken({
            transaction: initialTransaction,
            direction: 'out',
            contractAddress: initialTransaction.txParams.to,
          }),
        },
      };

    case TransactionType.tokenMethodIncreaseAllowance:
      return {
        type: 'increaseSpendingCap',
        chainId,
        status,
        timestamp,
        raw: { type: 'localTransaction', data: transactionGroup },
        data: {
          hash,
          token: getContractToken({
            transaction: initialTransaction,
            direction: 'out',
            contractAddress: initialTransaction.txParams.to,
          }),
        },
      };

    case TransactionType.lendingDeposit:
    case TransactionType.stakingDeposit:
      return {
        type: 'lendingDeposit',
        chainId,
        status,
        timestamp,
        raw: { type: 'localTransaction', data: transactionGroup },
        data: {
          hash,
          token: getContractToken({
            transaction: initialTransaction,
            direction: 'out',
            contractAddress: initialTransaction.txParams.to,
          }),
        },
      };

    case TransactionType.musdClaim:
      return {
        type: 'claimMusdBonus',
        chainId,
        status,
        timestamp,
        raw: { type: 'localTransaction', data: transactionGroup },
        data: {
          hash,
        },
      };

    default:
      return {
        type: 'contractInteraction',
        chainId,
        status,
        timestamp,
        raw: { type: 'localTransaction', data: transactionGroup },
        data: {
          hash,
          from,
          to,
          methodId: initialTransaction.txParams.data?.slice(0, 10),
          transactionType: initialTransaction.type,
        },
      };
  }
}
