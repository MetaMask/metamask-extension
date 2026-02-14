import type { Hex } from 'viem';
import type { InfiniteData } from '@tanstack/react-query';
import { toHex } from '@metamask/controller-utils';
import {
  type TransactionMeta,
  TransactionType,
  TransactionStatus,
} from '@metamask/transaction-controller';
import { V1TransactionByHashResponse } from '@metamask/core-backend';
import { CHAIN_ID_TO_CURRENCY_SYMBOL_MAP } from '../../constants/network';
import { TransactionGroupCategory } from '../../constants/transaction';
import type { NormalizedV4MultiAccountTransactionsResponse } from './types';

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
  transaction: V1TransactionByHashResponse,
) {
  const { chainId, valueTransfers = [] } = transaction;
  const address = accountAddress.toLowerCase();
  const hexChainId = toHex(
    chainId,
  ) as keyof typeof CHAIN_ID_TO_CURRENCY_SYMBOL_MAP;
  const nativeSymbol = CHAIN_ID_TO_CURRENCY_SYMBOL_MAP[hexChainId] || '';
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
  transaction: V1TransactionByHashResponse,
): Promise<TransactionMeta> {
  const { from, to, hash, methodId, isError } = transaction;

  const type = TransactionType.incoming;
  const status = isError
    ? TransactionStatus.failed
    : TransactionStatus.confirmed;

  // Find token transfer that involves the current address
  const valueTransfer = transaction.valueTransfers?.find(
    (vt) =>
      (vt.to?.toLowerCase() === address.toLowerCase() ||
        vt.from?.toLowerCase() === address.toLowerCase()) &&
      vt.contractAddress,
  );

  const isIncomingTokenTransfer =
    valueTransfer?.to?.toLowerCase() === address.toLowerCase() &&
    from.toLowerCase() !== address.toLowerCase();

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
    id: `${hash}-${transaction.chainId}`,
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

  return meta;
}

const INCLUDE_TOKEN_TRANSFERS = false;
const EXCLUDED_TRANSACTION_TYPES = ['SPAM_TOKEN_TRANSFER'];

// Ported from transaction-controller filterTransactions
export function filterTransactions(address: string) {
  const addr = address.toLowerCase();

  return (
    data: InfiniteData<NormalizedV4MultiAccountTransactionsResponse>,
  ): InfiniteData<NormalizedV4MultiAccountTransactionsResponse> => ({
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      data: page.data.filter((tx) => {
        // Ported from transaction-list.component isIncomingTxsButToAnotherAddress
        const from = tx.txParams?.from?.toLowerCase();
        const to = tx.txParams?.to?.toLowerCase();
        if (from !== addr && to !== addr) {
          return false;
        }

        if (EXCLUDED_TRANSACTION_TYPES.includes(tx.transactionType)) {
          return false;
        }

        if (!INCLUDE_TOKEN_TRANSFERS && tx.isTransfer) {
          return false;
        }

        return true;
      }),
    })),
  });
}
