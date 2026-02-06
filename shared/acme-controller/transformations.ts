import type { TransactionMeta } from '@metamask/transaction-controller';
import {
  TransactionType,
  TransactionStatus,
} from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import type { InfiniteData } from '@tanstack/react-query';
import { v4 as random } from 'uuid';
import { CHAIN_ID_TO_CURRENCY_SYMBOL_MAP } from '../constants/network';
import { TransactionGroupCategory } from '../constants/transaction';
// import { determineTransactionType } from '../modules/transaction.utils';
import type {
  TransactionResponse,
  NormalizedGetAccountTransactionsResponse,
} from './types';

function toHex(value: number | string): Hex {
  const num = typeof value === 'string' ? BigInt(value) : BigInt(value);
  return `0x${num.toString(16)}` as Hex;
}

export function mapTransactionToCategory(transactionType?: string) {
  switch (transactionType) {
    case 'ERC_20_APPROVE':
    case 'ERC_721_APPROVE':
    case 'ERC_1155_APPROVE':
      return TransactionGroupCategory.approval;
    case 'ERC_20_TRANSFER':
    case 'ERC_721_TRANSFER':
    case 'ERC_1155_TRANSFER':
      return TransactionGroupCategory.send;
    case 'INCOMING':
      return TransactionGroupCategory.receive;
    case 'METAMASK_V1_EXCHANGE':
      return TransactionGroupCategory.swap;
    case 'METAMASK_BRIDGE_V2_BRIDGE_OUT':
    case 'METAMASK_BRIDGE_V2_BRIDGE_IN':
      return TransactionGroupCategory.bridge;
    case 'CONTRACT_INTERACTION':
    case 'DEPLOY_CONTRACT':
    default:
      return TransactionGroupCategory.interaction;
  }
}

export function getTransferAmounts(
  accountAddress: string,
  transaction: TransactionResponse,
) {
  const { chainId, valueTransfers } = transaction;
  const address = accountAddress.toLowerCase();
  const nativeSymbol = CHAIN_ID_TO_CURRENCY_SYMBOL_MAP[toHex(chainId)] || '';
  const result: Record<string, unknown> = {};

  for (const transfer of valueTransfers) {
    const { amount, decimal, symbol, from, to } = transfer;

    if (!result.from && from?.toLowerCase() === address) {
      result.from = {
        amount: amount ? -BigInt(amount) : undefined,
        decimal,
        symbol: symbol || nativeSymbol,
      };
    }

    if (!result.to && to?.toLowerCase() === address) {
      result.to = {
        amount: amount ? BigInt(amount) : undefined,
        decimal,
        symbol: symbol || nativeSymbol,
      };
    }

    if (result.to && result.from) {
      break;
    }
  }

  return result;
}

// Ported from transaction-controller normalizeTransaction
export async function normalizeTransaction(
  address: string,
  transaction: TransactionResponse,
): Promise<TransactionMeta> {
  const { from, to, hash, methodId, isError } = transaction;

  const type = TransactionType.incoming;
  const status = isError
    ? TransactionStatus.failed
    : TransactionStatus.confirmed;

  // Find token transfer that involves the current address
  const valueTransfer = transaction.valueTransfers.find(
    (vt) =>
      (vt.to.toLowerCase() === address.toLowerCase() ||
        vt.from.toLowerCase() === address.toLowerCase()) &&
      vt.contractAddress,
  );

  const isIncomingTokenTransfer =
    valueTransfer?.to.toLowerCase() === address.toLowerCase() &&
    from.toLowerCase() !== address.toLowerCase();

  const isOutgoing = from.toLowerCase() === address.toLowerCase(); // TODO
  const amount = valueTransfer?.amount;
  const contractAddress = valueTransfer?.contractAddress as string;
  const decimals = valueTransfer?.decimal as number;
  const symbol = valueTransfer?.symbol as string;

  // For incoming token transfers, use the transfer amount, otherwise use transaction value
  const value = toHex(
    isIncomingTokenTransfer
      ? (valueTransfer?.amount ?? transaction.value)
      : transaction.value,
  );

  const error =
    status === TransactionStatus.failed
      ? new Error('Transaction failed')
      : undefined;

  const transferInformation = valueTransfer
    ? {
        amount,
        contractAddress,
        decimals,
        symbol,
      }
    : undefined;

  const meta: TransactionMeta = {
    blockNumber: String(transaction.blockNumber),
    chainId: toHex(transaction.chainId),
    error,
    hash,
    id: random(),
    isTransfer: isIncomingTokenTransfer,
    networkClientId: '',
    status,
    time: new Date(transaction.timestamp).getTime(),
    toSmartContract: false,
    transferInformation,
    txParams: {
      chainId: toHex(transaction.chainId),
      data: methodId as Hex,
      from: from as Hex,
      gas: toHex(transaction.gas),
      gasPrice: toHex(transaction.gasPrice),
      gasUsed: toHex(transaction.gasUsed),
      nonce: toHex(transaction.nonce),
      to: isIncomingTokenTransfer ? address : to,
      value,
    },
    type,
    verifiedOnBlockchain: false,
  };

  // TODO
  // For outgoing transactions, determine the actual transaction type
  // if (isOutgoing) {
  //   const result = await determineTransactionType(meta.txParams, {} as any);
  //   meta.type = result.type;
  // }

  return meta;
}

const INCLUDE_TOKEN_TRANSFERS = false;
const EXCLUDED_TRANSACTION_TYPES = ['SPAM_TOKEN_TRANSFER'];

// Ported from transaction-controller filterTransactions + more filters
export function filterTransactions(
  data: InfiniteData<NormalizedGetAccountTransactionsResponse>,
): InfiniteData<NormalizedGetAccountTransactionsResponse> {
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      data: INCLUDE_TOKEN_TRANSFERS
        ? page.data.filter(
            (tx) => !EXCLUDED_TRANSACTION_TYPES.includes(tx.transactionType),
          )
        : page.data.filter(
            (tx) =>
              !tx.isTransfer &&
              !EXCLUDED_TRANSACTION_TYPES.includes(tx.transactionType),
          ),
    })),
  };
}
