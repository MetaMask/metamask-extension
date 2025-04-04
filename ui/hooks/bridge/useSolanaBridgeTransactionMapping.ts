import { useSelector } from 'react-redux';
import { Transaction } from '@metamask/keyring-api';
import {
  isCaipChainId,
  type CaipChainId,
  type CaipAssetType,
} from '@metamask/utils';
import { Numeric, NumericValue } from '../../../shared/modules/Numeric';
import { NETWORK_TO_NAME_MAP } from '../../../shared/constants/network';
import {
  MULTICHAIN_PROVIDER_CONFIGS,
  MultichainNetworks,
} from '../../../shared/constants/multichain/networks';
import { MULTICHAIN_NATIVE_CURRENCY_TO_CAIP19 } from '../../../shared/constants/multichain/assets';
import { selectBridgeHistoryForAccount } from '../../ducks/bridge-status/selectors';

/**
 * Defines the structure for additional bridge-related information added to transactions.
 */
type BridgeInfo = {
  destChainId?: NumericValue;
  destChainName?: string;
  destAsset?: {
    symbol?: string;
    decimals?: number;
    [key: string]: unknown;
  };
  destTokenAmount?: string;
  status?: string;
  destTxHash?: string;
  srcTxHash?: string;
  provider?: string;
  destBlockExplorerUrl?: string;
};

/**
 * Extends the base Transaction type with custom fields used for transactions involved in bridging
 * that were *not* solely originated from the bridge history data.
 */
export type ExtendedTransaction = Transaction & {
  network?: string;
  isBridgeTx?: boolean;
  bridgeInfo?: BridgeInfo;
  isBridgeOriginated?: false; // Originated items use BridgeOriginatedItem type.
};

/**
 * Defines the specific structure for transactions originated purely from bridge history.
 * These items lack some fields present in standard `Transaction` objects.
 */
export type BridgeOriginatedItem = {
  id: string; // Source Tx Hash
  account: string;
  timestamp: number;
  type: 'send'; // Base type for potential filtering
  from: {
    address: string;
    asset: {
      type: CaipAssetType;
      amount: string;
      unit: string;
      fungible: boolean;
    };
  }[];
  to: [];
  isBridgeOriginated: true; // Discriminator flag
  bridgeStatus?: string; // Status reported by the bridge service.
  network?: string;
  isBridgeTx?: boolean;
  bridgeInfo?: BridgeInfo;
};

/**
 * Defines the data structure returned by the hook, containing a list of potentially mixed transaction types.
 */
type MixedTransactionsData = {
  transactions: (ExtendedTransaction | BridgeOriginatedItem)[];
  next: string | null;
  lastUpdated: number;
};

// Define a type for the bridge history items (replace 'any' with a specific type if available)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BridgeHistoryItem = any;

/**
 * Hook that takes a list of non-EVM transactions and enhances them with information
 * about related bridge operations. It identifies transactions that are part of a bridge,
 * adds details like destination chain and status, and includes transactions found
 * only in the bridge history (marked as `isBridgeOriginated`).
 *
 * @param initialNonEvmTransactions - The initial list of non-EVM transactions (assumed to be base `Transaction` type).
 * @returns An object containing the list of enhanced transactions (mixed `ExtendedTransaction` and `BridgeOriginatedItem`), or undefined if the input was undefined.
 */
export default function useSolanaBridgeTransactionMapping(
  initialNonEvmTransactions:
    | {
        transactions: Transaction[];
        next: string | null;
        lastUpdated: number;
      }
    | undefined,
): MixedTransactionsData | undefined {
  const bridgeHistory = useSelector(selectBridgeHistoryForAccount);

  /**
   * Gets a human-readable network name from a chain ID.
   *
   * @param chainId - The chain ID to resolve.
   * @returns The network name or the original chain ID if not found.
   */
  const getNetworkName = (chainId: NumericValue | undefined): string => {
    if (chainId === undefined || chainId === null) {
      return 'Unknown Network';
    }
    const chainIdStr = chainId.toString();

    let networkName =
      MULTICHAIN_PROVIDER_CONFIGS[
        chainIdStr as keyof typeof MULTICHAIN_PROVIDER_CONFIGS
      ]?.nickname;

    if (!networkName && !isNaN(Number(chainId))) {
      try {
        const hexChainId = new Numeric(chainId, 10).toPrefixedHexString();
        // @ts-expect-error WIP: Need to fix type for indexing NETWORK_TO_NAME_MAP with string
        networkName = NETWORK_TO_NAME_MAP[hexChainId];
      } catch (e) {
        console.error('Error converting chain ID', e);
      }
    }
    return networkName || chainIdStr;
  };

  // Create a lookup map for faster access to bridge history items by source transaction hash.
  const bridgeTxSignatures: { [key: string]: BridgeHistoryItem } = {};
  if (bridgeHistory) {
    Object.values(bridgeHistory).forEach((bridgeTx) => {
      const txHash = bridgeTx.status?.srcChain?.txHash;
      if (txHash) {
        bridgeTxSignatures[txHash] = bridgeTx;
      }
    });
  }

  // Clone input data. Initial txs are mapped to ExtendedTransaction (isBridgeOriginated: false).
  let nonEvmTransactions: MixedTransactionsData = initialNonEvmTransactions
    ? {
        ...initialNonEvmTransactions,
        transactions: (initialNonEvmTransactions.transactions || []).map(
          (tx) => ({ ...tx, isBridgeOriginated: false } as ExtendedTransaction),
        ),
      }
    : { transactions: [], next: null, lastUpdated: Date.now() };

  // Identify bridge operations from history that are NOT already in the main transaction list.
  // Create specific `BridgeOriginatedItem` objects for these.
  const bridgeOriginatedTxs: BridgeOriginatedItem[] = [];

  if (bridgeHistory) {
    Object.entries(bridgeHistory).forEach(([_id, bridgeTx]) => {
      // Limit to recent history (e.g., last 24 hours).
      const isRecent =
        bridgeTx.startTime &&
        Date.now() - bridgeTx.startTime < 24 * 60 * 60 * 1000;

      if (isRecent) {
        const srcTxHash = bridgeTx.status?.srcChain?.txHash;
        const existsInTxList = nonEvmTransactions.transactions.some(
          (tx) => tx.id === srcTxHash,
        );

        // If a recent bridge history item isn't in the main list, create a BridgeOriginatedItem for it.
        if (!existsInTxList && srcTxHash) {
          const timestampSeconds =
            ((bridgeTx.status?.status === 'COMPLETE'
              ? bridgeTx.completionTime ?? bridgeTx.startTime
              : bridgeTx.startTime) ?? Date.now()) / 1000;

          const rawChainId = bridgeTx.quote?.srcChainId;
          const chainId: CaipChainId = isCaipChainId(rawChainId)
            ? rawChainId
            : MultichainNetworks.SOLANA;

          const assetType: CaipAssetType =
            ((
              MULTICHAIN_NATIVE_CURRENCY_TO_CAIP19 as Record<
                CaipChainId,
                string
              >
            )[chainId] as CaipAssetType) ?? 'eip155:1/slip44:60';

          // Create the item with only the fields available from bridge history.
          const bridgeOriginatedTx: BridgeOriginatedItem = {
            id: srcTxHash,
            account: bridgeTx.account,
            timestamp: timestampSeconds,
            type: 'send',
            to: [],
            from: [
              {
                address: bridgeTx.account,
                asset: {
                  type: assetType,
                  amount: (
                    Number(bridgeTx.quote?.srcTokenAmount ?? 0) /
                    10 ** (bridgeTx.quote?.srcAsset?.decimals ?? 9)
                  ).toString(),
                  unit: bridgeTx.quote?.srcAsset?.symbol ?? 'Unknown',
                  fungible: true,
                },
              },
            ],
            isBridgeOriginated: true,
            bridgeStatus: bridgeTx.status?.status ?? 'PENDING',
            network: bridgeTx.quote?.srcChainId?.toString() ?? 'unknown',
            isBridgeTx: true,
            bridgeInfo: undefined,
          };
          bridgeOriginatedTxs.push(bridgeOriginatedTx);
        }
      }
    });
  }

  // Combine the original transactions with the newly created bridge-originated ones.
  if (bridgeOriginatedTxs.length > 0) {
    nonEvmTransactions = {
      ...nonEvmTransactions,
      transactions: [
        ...nonEvmTransactions.transactions,
        ...bridgeOriginatedTxs,
      ],
    };
  }

  // Return early if there are no transactions to process.
  if (!nonEvmTransactions.transactions.length) {
    return initialNonEvmTransactions === undefined &&
      bridgeOriginatedTxs.length === 0
      ? undefined
      : nonEvmTransactions;
  }

  // Final mapping step: Add bridgeInfo to relevant transactions.
  const modifiedTransactions: (ExtendedTransaction | BridgeOriginatedItem)[] =
    nonEvmTransactions.transactions.map((tx) => {
      const txSignature = tx.id;

      // Skip bridge processing for swaps.
      if (tx.type === 'swap' && !tx.isBridgeOriginated) {
        return {
          ...(tx as ExtendedTransaction),
          isBridgeTx: false,
          isBridgeOriginated: false,
        };
      }

      // Find matching bridge history data.
      const matchingBridgeTx = txSignature
        ? bridgeTxSignatures[txSignature]
        : null;

      // Case 1: Transaction (original or originated) matches bridge history.
      if (matchingBridgeTx) {
        const srcChainId = matchingBridgeTx.quote?.srcChainId;
        const destChainId = matchingBridgeTx.quote?.destChainId;
        const isBridgeTx =
          srcChainId !== undefined &&
          destChainId !== undefined &&
          srcChainId !== destChainId;

        // Construct bridgeInfo only if it's a true cross-chain bridge.
        const bridgeInfo: BridgeInfo | undefined = isBridgeTx
          ? {
              destChainId,
              destChainName: getNetworkName(destChainId),
              destAsset: {
                ...(matchingBridgeTx.quote?.destAsset ?? {}),
                decimals: matchingBridgeTx.quote?.destAsset?.decimals ?? 18,
              },
              destTokenAmount: matchingBridgeTx.quote?.destTokenAmount,
              status: matchingBridgeTx.status?.status ?? 'PENDING',
              destTxHash: matchingBridgeTx.status?.destChain?.txHash,
              srcTxHash: matchingBridgeTx.status?.srcChain?.txHash,
              provider: matchingBridgeTx.quote?.provider,
              destBlockExplorerUrl:
                matchingBridgeTx.quote?.destChain?.blockExplorerUrl,
            }
          : undefined;

        // Return the correct type with updated bridge info.
        if (tx.isBridgeOriginated) {
          // Return BridgeOriginatedItem with info.
          return {
            id: tx.id,
            account: tx.account,
            timestamp: tx.timestamp,
            type: tx.type,
            from: tx.from,
            to: tx.to,
            isBridgeOriginated: true,
            bridgeStatus: tx.bridgeStatus,
            network: tx.network,
            isBridgeTx,
            bridgeInfo,
          } as BridgeOriginatedItem;
        }
        // Return ExtendedTransaction with info.
        return {
          ...(tx as ExtendedTransaction),
          isBridgeTx,
          bridgeInfo,
          isBridgeOriginated: false,
        };
      }

      // Case 2: Transaction was originated, but no matching bridge history found now?
      // This might indicate stale data or an edge case. Treat as non-bridge.
      if (tx.isBridgeOriginated) {
        return {
          id: tx.id,
          account: tx.account,
          timestamp: tx.timestamp,
          type: tx.type,
          from: tx.from,
          to: tx.to,
          isBridgeOriginated: true,
          bridgeStatus: tx.bridgeStatus,
          network: tx.network,
          isBridgeTx: false,
          bridgeInfo: undefined,
        } as BridgeOriginatedItem;
      }

      // Case 3: Default - Not a swap, not originated, no bridge history match.
      return {
        ...(tx as ExtendedTransaction),
        isBridgeTx: false,
        isBridgeOriginated: false,
      };
    });

  // Return the final data structure.
  return {
    ...nonEvmTransactions,
    transactions: modifiedTransactions,
  };
}
