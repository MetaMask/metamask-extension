import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { getNativeAssetForChainId } from '@metamask/bridge-controller';
import { KnownCaipNamespace, toCaipChainId } from '@metamask/utils';
import {
  CHAIN_IDS,
  CHAIN_ID_TO_CURRENCY_SYMBOL_MAP,
} from '../../../constants/network';
import {
  IN_PROGRESS_TRANSACTION_STATUSES,
  NATIVE_TOKEN_ADDRESS,
  SmartTransactionStatus,
  TransactionGroupStatus,
} from '../../../constants/transaction';
import { STATIC_MAINNET_TOKEN_LIST } from '../../../constants/tokens';
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

function getSwapMetaDataTokenSymbol(
  transaction: TransactionGroup['initialTransaction'],
  key: 'token_from' | 'token_to',
) {
  const tokenSymbol = transaction.swapMetaData?.[key];
  return typeof tokenSymbol === 'string' ? tokenSymbol : undefined;
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

function getTokenTransferAmount(
  transaction: TransactionGroup['initialTransaction'],
) {
  const { data } = transaction.txParams;

  if (!data) {
    return undefined;
  }

  const transactionData = parseStandardTokenTransactionData(data);
  const value = transactionData?.args?._value ?? transactionData?.args?.value;

  return value?.toString();
}

function getTokenMetadata(chainId: string, contractAddress?: string) {
  if (!contractAddress || chainId !== CHAIN_IDS.MAINNET) {
    return undefined;
  }
  return STATIC_MAINNET_TOKEN_LIST[contractAddress.toLowerCase()];
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
  const nativeSymbol = getNativeTokenSymbol(initialTransaction.chainId);

  const getToken = ({
    contractAddress,
    direction,
    symbol,
    transaction,
  }: {
    contractAddress?: string;
    direction: TokenAmount['direction'];
    symbol?: string;
    transaction?: TransactionGroup['initialTransaction'];
  }) => {
    const tokenMetadata = getTokenMetadata(
      transaction?.chainId ?? initialTransaction.chainId,
      contractAddress,
    );

    let tokenSymbol;
    let assetId;
    let amount;
    let decimals;

    if (contractAddress) {
      tokenSymbol =
        transaction?.transferInformation?.symbol ??
        tokenMetadata?.symbol ??
        symbol;
      assetId = toAssetId(contractAddress, chainId);

      if (transaction?.transferInformation?.amount) {
        amount = transaction.transferInformation.amount;
        decimals = transaction.transferInformation.decimals;
      } else if (transaction) {
        amount = getTokenTransferAmount(transaction);
        decimals = tokenMetadata?.decimals;
      } else {
        decimals = tokenMetadata?.decimals;
      }
    } else {
      tokenSymbol = symbol ?? nativeSymbol;

      if (!tokenSymbol) {
        return undefined;
      }

      if (tokenSymbol === nativeSymbol) {
        assetId = toAssetId(NATIVE_TOKEN_ADDRESS, chainId);
      }

      if (transaction) {
        amount = transaction.txParams.value;
        decimals = getNativeAssetForChainId(transaction.chainId)?.decimals;
      }
    }

    return {
      direction,
      ...(tokenSymbol ? { symbol: tokenSymbol } : {}),
      ...(assetId ? { assetId } : {}),
      ...(amount ? { amount } : {}),
      ...(decimals === undefined ? {} : { decimals }),
    };
  };

  const status = mapStatus({ primaryTransaction, initialTransaction });
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
          token: getToken({
            transaction: initialTransaction,
            direction: 'out',
          }),
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
          token: getToken({
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
          token: getToken({
            transaction: initialTransaction,
            direction: 'in',
            contractAddress:
              initialTransaction.transferInformation?.contractAddress,
          }),
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
        (hasNativeValue(initialTransaction) ? nativeSymbol : undefined);
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
            sourceToken: getToken({
              symbol: sourceTokenSymbol,
              direction: 'out',
              contractAddress:
                initialTransaction.sourceTokenAddress ??
                primaryTransaction.sourceTokenAddress,
            }),
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
          sourceToken: getToken({
            symbol: sourceTokenSymbol,
            direction: 'out',
            contractAddress: sourceTokenAddress,
          }),
          destinationToken: getToken({
            symbol: destinationTokenSymbol,
            direction: 'in',
            contractAddress: destinationTokenAddress,
          }),
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
          token: getToken({
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
          token: getToken({
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
          token: getToken({
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
