import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { KnownCaipNamespace, toCaipChainId } from '@metamask/utils';
import type { CaipChainId } from '@metamask/utils';
import { CHAIN_ID_TO_CURRENCY_SYMBOL_MAP } from '../../../constants/network';
import {
  IN_PROGRESS_TRANSACTION_STATUSES,
  NATIVE_TOKEN_ADDRESS,
  SmartTransactionStatus,
  TransactionGroupStatus,
} from '../../../constants/transaction';
import { toAssetId } from '../../asset-utils';
import type { TransactionGroup } from '../../multichain/types';
import { parseStandardTokenTransactionData } from '../../transaction.utils';
import type { ActivityListItem, Status, TokenAmount } from '../types';

function getTransactionStatusKey(
  transaction: TransactionGroup['primaryTransaction'],
): string {
  const {
    txReceipt: { status: receiptStatus } = {},
    type,
    status,
  } = transaction;

  if (receiptStatus === '0x0') {
    return TransactionStatus.failed;
  }

  if (
    status === TransactionStatus.confirmed &&
    type === TransactionType.cancel
  ) {
    return TransactionGroupStatus.cancelled;
  }

  return transaction.status;
}

function mapStatus({
  primaryTransaction,
  initialTransaction,
}: {
  primaryTransaction: TransactionGroup['primaryTransaction'];
  initialTransaction: TransactionGroup['initialTransaction'];
}): Status {
  if (initialTransaction.isSmartTransaction) {
    const smartStatus = initialTransaction.status as string | undefined;

    if (smartStatus === SmartTransactionStatus.pending) {
      return 'pending';
    }

    if (smartStatus === SmartTransactionStatus.success) {
      return 'success';
    }

    if (smartStatus === SmartTransactionStatus.cancelled) {
      return 'failed';
    }

    return 'pending';
  }

  const statusKey = getTransactionStatusKey(primaryTransaction);

  if (statusKey === TransactionStatus.confirmed) {
    return 'success';
  }

  if (
    statusKey === TransactionStatus.cancelled ||
    statusKey === TransactionGroupStatus.cancelled ||
    statusKey === TransactionStatus.dropped ||
    statusKey === TransactionStatus.failed ||
    statusKey === TransactionStatus.rejected
  ) {
    return 'failed';
  }

  if (
    IN_PROGRESS_TRANSACTION_STATUSES.includes(
      statusKey as (typeof IN_PROGRESS_TRANSACTION_STATUSES)[number],
    )
  ) {
    return 'pending';
  }

  return 'pending';
}

function getNativeTokenSymbol(chainId: string) {
  return CHAIN_ID_TO_CURRENCY_SYMBOL_MAP[
    chainId as keyof typeof CHAIN_ID_TO_CURRENCY_SYMBOL_MAP
  ];
}

function getTokenSymbol(transaction: TransactionGroup['initialTransaction']) {
  return (
    transaction.transferInformation?.symbol ??
    transaction.sourceTokenSymbol ??
    transaction.destinationTokenSymbol ??
    getNativeTokenSymbol(transaction.chainId)
  );
}

function getSwapMetaDataTokenSymbol(
  transaction: TransactionGroup['initialTransaction'],
  key: 'token_from' | 'token_to',
) {
  const tokenSymbol = transaction.swapMetaData?.[key];
  return typeof tokenSymbol === 'string' ? tokenSymbol : undefined;
}

const resolveTokenAssetId = (
  chainId: CaipChainId,
  hexChainId: string,
  symbol: string | undefined,
  contractAddress?: string,
) => {
  if (contractAddress) {
    return toAssetId(contractAddress, chainId);
  }

  const nativeSymbol = getNativeTokenSymbol(hexChainId);
  if (!symbol || (nativeSymbol && symbol === nativeSymbol)) {
    return toAssetId(NATIVE_TOKEN_ADDRESS, chainId);
  }

  return undefined;
};

function getToken(
  symbol: string | undefined,
  direction: TokenAmount['direction'],
  chainId: CaipChainId,
  hexChainId: string,
  contractAddress?: string,
) {
  if (!symbol && !contractAddress) {
    return undefined;
  }

  const assetId = resolveTokenAssetId(
    chainId,
    hexChainId,
    symbol,
    contractAddress,
  );

  return {
    direction,
    ...(symbol ? { symbol } : {}),
    ...(assetId ? { assetId } : {}),
  };
}

function hasNativeValue(transaction: TransactionGroup['initialTransaction']) {
  const { value } = transaction.txParams;

  if (!value) {
    return false;
  }

  try {
    return BigInt(value) > 0n;
  } catch {
    return false;
  }
}

function getTokenTransferRecipient(
  transaction: TransactionGroup['initialTransaction'],
) {
  const { data, to } = transaction.txParams;

  if (!data) {
    return to ?? '';
  }

  const transactionData = parseStandardTokenTransactionData(data);
  const recipient = transactionData?.args?._to ?? transactionData?.args?.to;

  return typeof recipient === 'string' ? recipient : (to ?? '');
}

// Converts local TransactionController groups into activity items
export function mapLocalTransaction({
  transactionGroup,
}: {
  transactionGroup: TransactionGroup;
}): ActivityListItem {
  const { initialTransaction, primaryTransaction } = transactionGroup;
  const chainId = toCaipChainId(
    KnownCaipNamespace.Eip155,
    Number.parseInt(initialTransaction.chainId, 16).toString(),
  );
  const hexChainId = initialTransaction.chainId;
  const status = mapStatus({ primaryTransaction, initialTransaction });
  const timestamp = primaryTransaction.time ?? initialTransaction.time;
  const hash =
    primaryTransaction.hash ?? initialTransaction.hash ?? primaryTransaction.id;
  const from = initialTransaction.txParams.from ?? '';
  const to = initialTransaction.txParams.to ?? '';

  switch (initialTransaction.type) {
    case TransactionType.simpleSend: {
      const tokenSymbol = getTokenSymbol(initialTransaction);
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
          token: getToken(tokenSymbol, 'out', chainId, hexChainId),
        },
      };
    }

    case TransactionType.tokenMethodSafeTransferFrom:
    case TransactionType.tokenMethodTransfer:
    case TransactionType.tokenMethodTransferFrom: {
      const recipient = getTokenTransferRecipient(initialTransaction);

      return {
        type: 'send',
        chainId,
        status,
        timestamp,
        raw: { type: 'localTransaction', data: transactionGroup },
        data: {
          hash,
          from,
          to: recipient,
          token: getToken(
            getTokenSymbol(initialTransaction),
            'out',
            chainId,
            hexChainId,
            initialTransaction.txParams.to,
          ),
        },
      };
    }

    case TransactionType.incoming: {
      const tokenSymbol = getTokenSymbol(initialTransaction);

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
          token: getToken(
            tokenSymbol,
            'in',
            chainId,
            hexChainId,
            initialTransaction.transferInformation?.contractAddress,
          ),
        },
      };
    }

    case TransactionType.swap:
    case TransactionType.swapAndSend: {
      const sourceTokenSymbol =
        initialTransaction.sourceTokenSymbol ??
        primaryTransaction.sourceTokenSymbol ??
        getSwapMetaDataTokenSymbol(initialTransaction, 'token_from') ??
        getSwapMetaDataTokenSymbol(primaryTransaction, 'token_from') ??
        (hasNativeValue(initialTransaction)
          ? getNativeTokenSymbol(initialTransaction.chainId)
          : undefined);
      const destinationTokenSymbol =
        initialTransaction.destinationTokenSymbol ??
        primaryTransaction.destinationTokenSymbol ??
        getSwapMetaDataTokenSymbol(initialTransaction, 'token_to') ??
        getSwapMetaDataTokenSymbol(primaryTransaction, 'token_to');

      if (!destinationTokenSymbol) {
        return {
          type: 'swapIncomplete',
          chainId,
          status,
          timestamp,
          raw: { type: 'localTransaction', data: transactionGroup },
          data: {
            hash,
            sourceToken: getToken(
              sourceTokenSymbol,
              'out',
              chainId,
              hexChainId,
              initialTransaction.sourceTokenAddress ??
                primaryTransaction.sourceTokenAddress,
            ),
          },
        };
      }

      const sourceTokenAddress =
        initialTransaction.sourceTokenAddress ??
        primaryTransaction.sourceTokenAddress;
      const destinationTokenAddress =
        initialTransaction.destinationTokenAddress ??
        primaryTransaction.destinationTokenAddress;

      return {
        type: 'swap',
        chainId,
        status,
        timestamp,
        raw: { type: 'localTransaction', data: transactionGroup },
        data: {
          hash,
          sourceToken: getToken(
            sourceTokenSymbol,
            'out',
            chainId,
            hexChainId,
            sourceTokenAddress,
          ),
          destinationToken: getToken(
            destinationTokenSymbol,
            'in',
            chainId,
            hexChainId,
            destinationTokenAddress,
          ),
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
          tokenSymbol: getTokenSymbol(initialTransaction),
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
          tokenSymbol: getTokenSymbol(initialTransaction),
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
          token: getToken(
            getTokenSymbol(initialTransaction),
            'out',
            chainId,
            hexChainId,
            initialTransaction.txParams.to,
          ),
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
