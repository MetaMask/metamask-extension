import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { KnownCaipNamespace, toCaipChainId } from '@metamask/utils';
import type { TransactionGroup } from '../../multichain/types';
import { CHAIN_ID_TO_CURRENCY_SYMBOL_MAP } from '../../../constants/network';
import type { ActivityListItem, Status } from '../types';

function mapStatus(
  status: TransactionGroup['primaryTransaction']['status'],
): Status {
  switch (status) {
    case TransactionStatus.confirmed:
      return 'success';
    case TransactionStatus.cancelled:
    case TransactionStatus.dropped:
    case TransactionStatus.failed:
    case TransactionStatus.rejected:
      return 'failed';
    default:
      return 'pending';
  }
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

function hasNativeValue(transaction: TransactionGroup['initialTransaction']) {
  const value = transaction.txParams.value;
  return Boolean(value && value !== '0' && value !== '0x0');
}

// Converts local TransactionController groups into activity items
export function mapLocalTransaction({
  transactionGroup,
  sourceTokenSymbol: fallbackSourceTokenSymbol,
  destinationTokenSymbol: fallbackDestinationTokenSymbol,
}: {
  transactionGroup: TransactionGroup;
  sourceTokenSymbol?: string;
  destinationTokenSymbol?: string;
}): ActivityListItem {
  const { initialTransaction, primaryTransaction } = transactionGroup;
  const chainId = toCaipChainId(
    KnownCaipNamespace.Eip155,
    parseInt(initialTransaction.chainId, 16).toString(),
  );
  const status = mapStatus(primaryTransaction.status);
  const timestamp = primaryTransaction.time ?? initialTransaction.time;
  const hash =
    primaryTransaction.hash ?? initialTransaction.hash ?? primaryTransaction.id;
  const from = initialTransaction.txParams.from ?? '';
  const to = initialTransaction.txParams.to ?? '';

  switch (initialTransaction.type) {
    case TransactionType.simpleSend:
    case TransactionType.tokenMethodSafeTransferFrom:
    case TransactionType.tokenMethodTransfer:
    case TransactionType.tokenMethodTransferFrom:
      return {
        type: 'send',
        chainId,
        status,
        timestamp,
        data: {
          hash,
          from,
          to,
          tokenSymbol: getTokenSymbol(initialTransaction),
        },
      };

    case TransactionType.incoming:
      return {
        type: 'receive',
        chainId,
        status,
        timestamp,
        data: {
          hash,
          from,
          to,
          tokenSymbol: getTokenSymbol(initialTransaction),
        },
      };

    case TransactionType.swap:
    case TransactionType.swapAndSend:
      const sourceTokenSymbol =
        initialTransaction.sourceTokenSymbol ??
        primaryTransaction.sourceTokenSymbol ??
        getSwapMetaDataTokenSymbol(initialTransaction, 'token_from') ??
        getSwapMetaDataTokenSymbol(primaryTransaction, 'token_from') ??
        fallbackSourceTokenSymbol ??
        (hasNativeValue(initialTransaction)
          ? getNativeTokenSymbol(initialTransaction.chainId)
          : undefined);
      const destinationTokenSymbol =
        initialTransaction.destinationTokenSymbol ??
        primaryTransaction.destinationTokenSymbol ??
        getSwapMetaDataTokenSymbol(initialTransaction, 'token_to') ??
        getSwapMetaDataTokenSymbol(primaryTransaction, 'token_to') ??
        fallbackDestinationTokenSymbol;

      if (!destinationTokenSymbol) {
        return {
          type: 'swapIncomplete',
          chainId,
          status,
          timestamp,
          data: {
            hash,
            sourceTokenSymbol,
          },
        };
      }

      return {
        type: 'swap',
        chainId,
        status,
        timestamp,
        data: {
          hash,
          sourceTokenSymbol,
          destinationTokenSymbol,
        },
      };

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
          tokenSymbol: getTokenSymbol(initialTransaction),
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
