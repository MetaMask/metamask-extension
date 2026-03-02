import type { Transaction } from '@metamask/keyring-api';
import type { CaipChainId } from '@metamask/utils';
import type {
  Token,
  TokenAmount,
  TransactionGroup,
  TransactionViewModel,
} from '../../../../shared/lib/multichain/types';
import { formatUnits } from '../../../../shared/lib/unit';

export type ActivityListFilter = {
  tokenAddress?: string;
  chainId?: CaipChainId;
};

export type FlattenedItem =
  | { type: 'date-header'; date: number }
  | { type: 'local'; transactionGroup: TransactionGroup; id: string }
  | { type: 'completed'; data: TransactionViewModel; id: string }
  | { type: 'non-evm'; transaction: Transaction; id: string };

function parseDate(timestamp: string | number) {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

// Get the primary display amount for a transaction.
// - For swaps (has both from and to): returns the "from" amount (negative)
// - For sends: returns the "from" amount
// - For receives: returns the "to" amount
export function getPrimaryAmount(amounts: {
  from?: TokenAmount;
  to?: TokenAmount;
}): {
  amount?: `${number}`;
  token?: Token;
} {
  const { from, to } = amounts;

  // For swaps or outgoing transactions, show the sent amount (from) as negative
  if (from) {
    const formatted = formatUnits(from.amount, from.token.decimals);
    const amount = formatted.startsWith('-') ? formatted : `-${formatted}`;
    return { amount: amount as `${number}`, token: from.token };
  }

  // For incoming transactions, use to
  if (to) {
    return {
      amount: formatUnits(to.amount, to.token.decimals) as `${number}`,
      token: to.token,
    };
  }

  return {};
}

export function filterLocalNotInApi(
  localGroups: TransactionGroup[],
  apiTransactions: TransactionViewModel[],
  pendingStatusHash: Record<string, boolean>,
): TransactionGroup[] {
  // Build a set of transaction hashes from API for deduplication
  const apiHashes = new Set(
    apiTransactions
      .map((tx) => tx.hash?.toLowerCase())
      .filter((hash): hash is string => Boolean(hash)),
  );

  return localGroups.filter((group) => {
    const tx = group.primaryTransaction;
    const isPending = tx.status in pendingStatusHash;
    // Pending transactions are always included (not in API yet)
    if (isPending) {
      return true;
    }
    // Completed transactions: only include if NOT already in API
    // Transactions without a hash (e.g. failed relay transactions) are always included
    const hash = tx.hash?.toLowerCase();
    const inApi = hash && apiHashes.has(hash);
    return !hash || !inApi;
  });
}

type MergedItem =
  | { type: 'local'; group: TransactionGroup; time: number; nonce: number }
  | { type: 'completed'; tx: TransactionViewModel; time: number; nonce: number }
  | { type: 'non-evm'; transaction: Transaction; time: number; nonce: number };

export function mergeAllTransactionsByTime(
  localTransactionGroups: TransactionGroup[],
  apiTransactions: TransactionViewModel[],
  nonEvmTransactions: Transaction[] = [],
): MergedItem[] {
  const localItems = localTransactionGroups.map((group) => ({
    type: 'local' as const,
    group,
    time: group.primaryTransaction.time ?? 0,
    nonce: group.primaryTransaction.txParams?.nonce
      ? parseInt(group.primaryTransaction.txParams.nonce, 16) || 0
      : 0,
  }));

  const completedItems = apiTransactions.map((tx) => ({
    type: 'completed' as const,
    tx,
    time: tx.time ?? 0,
    nonce: tx.nonce,
  }));

  const nonEvmItems = nonEvmTransactions.map((transaction) => ({
    type: 'non-evm' as const,
    transaction,
    time: (transaction.timestamp ?? 0) * 1000,
    nonce: 0,
  }));

  // Sort by time (newest first), then by nonce (highest first) for same-block txs
  return [...localItems, ...completedItems, ...nonEvmItems].sort(
    (a, b) => b.time - a.time || b.nonce - a.nonce,
  );
}

export function groupAndFlattenMergedTransactions(
  mergedItems: MergedItem[],
): FlattenedItem[] {
  if (mergedItems.length === 0) {
    return [];
  }

  const flattened: FlattenedItem[] = [];
  let currentDate: number | null = null;

  for (const item of mergedItems) {
    const date = parseDate(item.time);

    // Add date header when date changes
    if (date !== currentDate) {
      flattened.push({ type: 'date-header', date });
      currentDate = date;
    }

    // Add the transaction item based on type
    if (item.type === 'local') {
      flattened.push({
        type: 'local',
        id: item.group.primaryTransaction.id,
        transactionGroup: item.group,
      });
    } else if (item.type === 'non-evm') {
      flattened.push({
        type: 'non-evm',
        id: item.transaction.id,
        transaction: item.transaction,
      });
    } else {
      flattened.push({
        type: 'completed',
        id: item.tx.id,
        data: item.tx,
      });
    }
  }

  return flattened;
}

/**
 * Returns true if the API transaction involves the given token address
 * (as sender, receiver, or in value transfers).
 *
 * @param tx - The API transaction view model.
 * @param tokenAddress - The token contract address to match against.
 * @returns Whether the transaction involves the given token.
 */
export function matchesApiTransaction(
  tx: TransactionViewModel,
  tokenAddress: string,
): boolean {
  const addr = tokenAddress.toLowerCase();
  if (tx.amounts?.from?.token.address?.toLowerCase() === addr) {
    return true;
  }
  if (tx.amounts?.to?.token.address?.toLowerCase() === addr) {
    return true;
  }
  return (
    tx.valueTransfers?.some(
      (vt) => vt.contractAddress?.toLowerCase() === addr,
    ) ?? false
  );
}

/**
 * Returns true if the local transaction group's target contract matches the token address.
 * For ERC-20 interactions, txParams.to is the token contract.
 *
 * @param group - The local transaction group.
 * @param tokenAddress - The token contract address to match against.
 * @returns Whether the transaction group targets the given token contract.
 */
export function matchesLocalTransaction(
  group: TransactionGroup,
  tokenAddress: string,
): boolean {
  return (
    group.initialTransaction.txParams?.to?.toLowerCase() ===
    tokenAddress.toLowerCase()
  );
}

/**
 * Returns true if the non-EVM transaction involves the given token address
 * by checking the CAIP asset type in from/to asset entries.
 *
 * @param tx - The non-EVM transaction to check.
 * @param tokenAddress - The CAIP asset type or address to match against.
 * @returns Whether the transaction involves the given token.
 */
export function matchesNonEvmTransaction(
  tx: Transaction,
  tokenAddress: string,
): boolean {
  const addr = tokenAddress.toLowerCase();
  const assetEntries = [...(tx.from ?? []), ...(tx.to ?? [])];
  return assetEntries.some((entry) => {
    if (!entry.asset) {
      return false;
    }
    if (entry.asset.fungible) {
      return entry.asset.type.toLowerCase() === addr;
    }
    return 'id' in entry.asset && entry.asset.id.toLowerCase().includes(addr);
  });
}

export function calculateFiatFromMarketRates(
  amount: string | undefined,
  token: Token | undefined,
  marketRates: Record<number, Record<string, number>>,
) {
  if (amount === undefined || !token) {
    return undefined;
  }

  const parsed = parseFloat(amount);
  const rate = marketRates[parseInt(token.chainId, 16)]?.[token.address];
  return rate === undefined ? undefined : parsed * rate;
}
