import type { Transaction } from '@metamask/keyring-api';
import type { CaipChainId } from '@metamask/utils';
import { TransactionType } from '@metamask/transaction-controller';
import type {
  Token,
  TokenAmount,
  TransactionGroup,
  TransactionViewModel,
} from '../../../../shared/lib/multichain/types';
import { NATIVE_TOKEN_ADDRESS } from '../../../../shared/constants/transaction';
import { resolveTransactionType as resolveMusdClaimType } from '../../app/transaction-list-item/helpers';
import { formatUnits } from '../../../../shared/lib/unit';

export type AssetScope =
  | { kind: 'native'; caipAssetType?: string }
  | { kind: 'token'; tokenAddress: string };

export type ActivityListFilter = {
  chainId: CaipChainId;
  assetScope: AssetScope;
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
 * Returns true if the API transaction matches the given asset scope.
 *
 * @param tx - The API transaction view model.
 * @param scope - The asset scope to filter by.
 * @returns Whether the transaction involves the scoped asset.
 */
export function matchesApiTransaction(
  tx: TransactionViewModel,
  scope: AssetScope,
): boolean {
  const addr =
    scope.kind === 'native'
      ? NATIVE_TOKEN_ADDRESS
      : scope.tokenAddress.toLowerCase();

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
 * Returns true if the local transaction group matches the given asset scope.
 * For native assets, matches by transaction type (simpleSend/incoming).
 * For tokens, matches by txParams.to (the token contract address).
 *
 * @param group - The local transaction group.
 * @param scope - The asset scope to filter by.
 * @returns Whether the transaction group matches the scoped asset.
 */
export function matchesLocalTransaction(
  group: TransactionGroup,
  scope: AssetScope,
): boolean {
  if (scope.kind === 'native') {
    const txType = group.primaryTransaction?.type;
    if (!txType) {
      return true;
    }
    return (
      txType === TransactionType.simpleSend ||
      txType === TransactionType.incoming
    );
  }
  return (
    group.initialTransaction.txParams?.to?.toLowerCase() ===
    scope.tokenAddress.toLowerCase()
  );
}

/**
 * Returns true if the non-EVM transaction involves the given asset scope
 * by checking the CAIP asset type in from/to asset entries.
 *
 * @param tx - The non-EVM transaction to check.
 * @param scope - The asset scope to filter by.
 * @returns Whether the transaction involves the scoped asset.
 */
export function matchesNonEvmTransaction(
  tx: Transaction,
  scope: AssetScope,
): boolean {
  const addr =
    scope.kind === 'native'
      ? scope.caipAssetType?.toLowerCase()
      : scope.tokenAddress.toLowerCase();

  if (!addr) {
    return false;
  }

  const assetEntries = [...(tx.from ?? []), ...(tx.to ?? [])];
  return assetEntries.some((entry) => {
    if (!entry.asset) {
      return false;
    }
    if (entry.asset.fungible) {
      return entry.asset.type?.toLowerCase() === addr;
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

// Map API transactionCategory to TransactionType for legacy modal
export function resolveTransactionType(
  tx: TransactionViewModel,
): TransactionType {
  const { transactionCategory, transactionType } = tx;

  if (transactionCategory === 'APPROVE') {
    return TransactionType.tokenMethodApprove;
  }
  if (
    transactionCategory === 'BRIDGE_OUT' ||
    transactionCategory === 'BRIDGE_IN'
  ) {
    return TransactionType.bridge;
  }

  if (transactionCategory === 'SWAP' || transactionCategory === 'EXCHANGE') {
    return TransactionType.swap;
  }

  // Specifics from transactionType
  if (transactionType === 'DEPLOY_CONTRACT') {
    return TransactionType.deployContract;
  }

  if (transactionType === 'ERC_20_TRANSFER') {
    return TransactionType.tokenMethodTransfer;
  }

  if (
    transactionType === 'ERC_721_TRANSFER' ||
    transactionType === 'ERC_1155_TRANSFER'
  ) {
    return TransactionType.tokenMethodTransferFrom;
  }

  if (transactionCategory === 'TRANSFER') {
    if (tx.amounts?.to && !tx.amounts?.from) {
      return TransactionType.incoming;
    }
    if (tx.amounts?.from) {
      return TransactionType.simpleSend;
    }
  }

  // Detect Merkl claim transactions — only when the tx would otherwise be
  // a generic contractInteraction, matching the legacy activity list guard.
  return (
    resolveMusdClaimType(
      TransactionType.contractInteraction,
      tx.txParams?.to,
      tx.txParams?.data,
    ) ?? TransactionType.contractInteraction
  );
}
