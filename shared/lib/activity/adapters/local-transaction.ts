import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { KnownCaipNamespace, toCaipChainId } from '@metamask/utils';
import { CHAIN_ID_TO_CURRENCY_SYMBOL_MAP } from '../../../constants/network';
import { parseStandardTokenTransactionData } from '../../transaction.utils';
import type { TransactionGroup } from '../../multichain/types';
import type { ActivityListItem, Status, TokenAmount } from '../types';

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

function getToken(
  symbol: string | undefined,
  direction: TokenAmount['direction'],
) {
  return symbol ? { symbol, direction } : undefined;
}

function hasNativeValue(transaction: TransactionGroup['initialTransaction']) {
  const { value } = transaction.txParams;
  return Boolean(value && value !== '0' && value !== '0x0');
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
  const status = mapStatus(primaryTransaction.status);
  const timestamp = primaryTransaction.time ?? initialTransaction.time;
  const hash =
    primaryTransaction.hash ?? initialTransaction.hash ?? primaryTransaction.id;
  const from = initialTransaction.txParams.from ?? '';
  const to = initialTransaction.txParams.to ?? '';
  const metaId = primaryTransaction.id;

  switch (initialTransaction.type) {
    case TransactionType.simpleSend:
      return {
        type: 'send',
        chainId,
        status,
        timestamp,
        metaId,
        data: {
          hash,
          from,
          to,
          token: getToken(getTokenSymbol(initialTransaction), 'out'),
        },
      };

    case TransactionType.tokenMethodSafeTransferFrom:
    case TransactionType.tokenMethodTransfer:
    case TransactionType.tokenMethodTransferFrom: {
      const recipient = getTokenTransferRecipient(initialTransaction);

      return {
        type: 'send',
        chainId,
        status,
        timestamp,
        metaId,
        data: {
          hash,
          from,
          to: recipient,
          token: getToken(getTokenSymbol(initialTransaction), 'out'),
        },
      };
    }

    case TransactionType.incoming:
      return {
        type: 'receive',
        chainId,
        status,
        timestamp,
        metaId,
        data: {
          hash,
          from,
          to,
          token: getToken(getTokenSymbol(initialTransaction), 'in'),
        },
      };

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
          metaId,
          data: {
            hash,
            sourceToken: getToken(sourceTokenSymbol, 'out'),
          },
        };
      }

      return {
        type: 'swap',
        chainId,
        status,
        timestamp,
        metaId,
        data: {
          hash,
          sourceToken: getToken(sourceTokenSymbol, 'out'),
          destinationToken: getToken(destinationTokenSymbol, 'in'),
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
        metaId,
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
        metaId,
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
        metaId,
        data: {
          hash,
          token: getToken(getTokenSymbol(initialTransaction), 'out'),
        },
      };

    case TransactionType.musdClaim:
      return {
        type: 'claimMusdBonus',
        chainId,
        status,
        timestamp,
        metaId,
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
        metaId,
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
