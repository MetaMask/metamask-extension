import type { Hex } from 'viem';
import type { InfiniteData } from '@tanstack/react-query';
import { toHex } from '@metamask/controller-utils';
import {
  type TransactionMeta,
  TransactionType,
  TransactionStatus,
} from '@metamask/transaction-controller';
import {
  V1TransactionByHashResponse,
  type V4MultiAccountTransactionsResponse,
} from '@metamask/core-backend';
import { CHAIN_ID_TO_CURRENCY_SYMBOL_MAP } from '../../constants/network';
import { NATIVE_TOKEN_ADDRESS } from '../../constants/transaction';
import type {
  NormalizedV4MultiAccountTransactionsResponse,
  TokenAmount,
  TransactionViewModel,
} from './types';

function safeBigInt(value: string) {
  try {
    return BigInt(value);
  } catch {
    return undefined;
  }
}

export function parseValueTransfers(
  accountAddress: string,
  transaction: V1TransactionByHashResponse,
) {
  const { chainId, valueTransfers = [] } = transaction;
  const address = accountAddress.toLowerCase();
  const hexChainId = toHex(
    chainId,
  ) as keyof typeof CHAIN_ID_TO_CURRENCY_SYMBOL_MAP;
  const nativeSymbol = CHAIN_ID_TO_CURRENCY_SYMBOL_MAP[hexChainId] || '';
  const result: { from?: TokenAmount; to?: TokenAmount } = {};

  for (const transfer of valueTransfers) {
    if (
      transfer.transferType === 'erc721' ||
      transfer.transferType === 'erc1155'
    ) {
      continue;
    }

    const { amount, decimal, symbol, from, to, contractAddress } = transfer;
    const tokenAddress = contractAddress?.toLowerCase() ?? NATIVE_TOKEN_ADDRESS;

    const token = {
      chainId: hexChainId,
      address: tokenAddress,
      decimals: decimal,
      symbol: symbol || nativeSymbol,
    };

    if (!result.from && from?.toLowerCase() === address && amount) {
      const parsed = safeBigInt(amount);
      if (parsed !== undefined) {
        result.from = { token, amount: -parsed };
      }
    }

    if (!result.to && to?.toLowerCase() === address && amount) {
      const parsed = safeBigInt(amount);
      if (parsed !== undefined) {
        result.to = { token, amount: parsed };
      }
    }

    if (result.to && result.from) {
      break;
    }
  }

  if (
    valueTransfers.length === 0 &&
    (transaction.transactionCategory === 'STANDARD' ||
      transaction.transactionType === 'STANDARD')
  ) {
    result.from = {
      token: {
        address: NATIVE_TOKEN_ADDRESS,
        symbol: nativeSymbol,
        decimals: 18,
        chainId: hexChainId,
      },
      amount: -(safeBigInt(transaction.value) ?? BigInt(0)),
    };
  }

  return result;
}

// Ported from transaction-controller normalizeTransaction
export function normalizeTransaction(
  address: string,
  transaction: V1TransactionByHashResponse,
): TransactionMeta {
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

// Transform and filter raw API response
export function selectTransactions({
  address,
  excludedTxHashes,
}: {
  address: string;
  excludedTxHashes?: Set<string>;
}) {
  const addr = address.toLowerCase();

  return (
    data: InfiniteData<V4MultiAccountTransactionsResponse>,
  ): InfiniteData<NormalizedV4MultiAccountTransactionsResponse> => ({
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      data: page.data.reduce<TransactionViewModel[]>((result, raw) => {
        // Filter out transactions not involving the current address
        const rawFrom = raw.from?.toLowerCase();
        const rawTo = raw.to?.toLowerCase();
        if (rawFrom !== addr && rawTo !== addr) {
          return result;
        }

        // Filter out excluded transaction hashes (e.g. internal prerequisite transactions)
        if (raw.hash && excludedTxHashes?.has(raw.hash.toLowerCase())) {
          return result;
        }

        // Filter out excluded transaction types
        if (EXCLUDED_TRANSACTION_TYPES.includes(raw.transactionType ?? '')) {
          return result;
        }

        // Filter out zero-value self-sends with no calldata and no transfers
        if (
          rawFrom === addr &&
          rawTo === addr &&
          raw.value === '0' &&
          !raw.valueTransfers?.length &&
          (!raw.methodId || raw.methodId === '0x')
        ) {
          return result;
        }

        const meta = normalizeTransaction(addr, raw);

        // Filter out token transfers
        if (!INCLUDE_TOKEN_TRANSFERS && meta.isTransfer) {
          return result;
        }

        // Enrich with amounts and raw API classification
        const amounts = parseValueTransfers(addr, raw);

        const transactionProtocol =
          raw.transactionProtocol ||
          raw.valueTransfers?.find(
            (vt) =>
              vt.transferType === 'erc721' || vt.transferType === 'erc1155',
          )?.transferType ||
          '';

        result.push({
          ...meta,
          // @ts-expect-error readable not in V1TransactionByHashResponse type yet
          readable: raw.readable,
          nonce: raw.nonce,
          amounts,
          transactionType: raw.transactionType || '',
          transactionCategory: raw.transactionCategory || '',
          transactionProtocol,
          valueTransfers: raw.valueTransfers,
        });

        return result;
      }, []),
    })),
  });
}
