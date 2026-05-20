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
): string | undefined => {
  if (contractAddress) {
    return toAssetId(contractAddress, chainId);
  }

  const nativeSymbol = getNativeTokenSymbol(hexChainId);
  if (!symbol || (nativeSymbol && symbol === nativeSymbol)) {
    return toAssetId(NATIVE_TOKEN_ADDRESS, chainId);
  }

  return undefined;
};

const getToken = (
  symbol: string | undefined,
  direction: TokenAmount['direction'],
  chainId: CaipChainId,
  hexChainId: string,
  contractAddress?: string,
) => {
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
};

// Converts local TransactionController groups into activity items
export function mapLocalTransaction({
  transactionGroup,
}: {
  transactionGroup: TransactionGroup;
}): ActivityListItem {
  const { initialTransaction, primaryTransaction } = transactionGroup;
  const chainId = toCaipChainId(
    KnownCaipNamespace.Eip155,
    parseInt(initialTransaction.chainId, 16).toString(),
  );
  const hexChainId = initialTransaction.chainId;
  const status = mapStatus({ primaryTransaction, initialTransaction });
  const timestamp = primaryTransaction.time ?? initialTransaction.time;
  const hash =
    primaryTransaction.hash ?? initialTransaction.hash ?? primaryTransaction.id;
  const from = initialTransaction.txParams.from ?? '';
  const to = initialTransaction.txParams.to ?? '';

  switch (initialTransaction.type) {
    case TransactionType.simpleSend:
    case TransactionType.tokenMethodSafeTransferFrom:
    case TransactionType.tokenMethodTransfer:
    case TransactionType.tokenMethodTransferFrom: {
      const tokenSymbol = getTokenSymbol(initialTransaction);
      const contractAddress =
        initialTransaction.type === TransactionType.simpleSend
          ? undefined
          : initialTransaction.txParams.to;

      return {
        type: 'send',
        chainId,
        status,
        timestamp,
        data: {
          hash,
          from,
          to,
          token: getToken(
            tokenSymbol,
            'out',
            chainId,
            hexChainId,
            contractAddress,
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
        data: {
          hash,
          from,
          to,
          token: getToken(tokenSymbol, 'in', chainId, hexChainId),
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
        getNativeTokenSymbol(initialTransaction.chainId);
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
