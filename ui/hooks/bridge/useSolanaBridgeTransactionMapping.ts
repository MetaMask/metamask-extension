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
 * Extends the base Transaction type with custom fields used for non-originated bridge transactions.
 */
export type ExtendedTransaction = Transaction & {
  network?: string;
  isBridgeTx?: boolean;
  bridgeInfo?: BridgeInfo;
  isBridgeOriginated?: false; // Ensure this is explicitly false or undefined for this type
};

/**
 * Defines the specific structure for transactions originated purely from bridge history.
 * Does NOT extend the base Transaction type and omits fields not present in bridge history.
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
  to: []; // Not applicable for originated items
  isBridgeOriginated: true; // Discriminator
  bridgeStatus?: string;
  network?: string;
  isBridgeTx?: boolean;
  bridgeInfo?: BridgeInfo;
  // Does NOT include: status, chain, events, fees etc. from base Transaction
};

/**
 * Defines the data structure returned by the hook, containing a list of potentially mixed transaction types.
 */
type MixedTransactionsData = {
  transactions: (ExtendedTransaction | BridgeOriginatedItem)[]; // Array of mixed types
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
 * @param initialNonEvmTransactions - The initial list of non-EVM transactions.
 * @returns An object containing the list of enhanced transactions (mixed types), or undefined if the input was undefined.
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
  // Return mixed data type
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

  // Clone the input data. The initial transactions are treated as potential ExtendedTransaction.
  let nonEvmTransactions: MixedTransactionsData = initialNonEvmTransactions
    ? {
        ...initialNonEvmTransactions,
        // Map initial transactions - assume they are NOT originated
        transactions: (initialNonEvmTransactions.transactions || []).map(
          (tx) => ({ ...tx, isBridgeOriginated: false } as ExtendedTransaction),
        ),
      }
    : { transactions: [], next: null, lastUpdated: Date.now() };

  // Identify and create specific items for recent bridge operations found only in the bridge history.
  const bridgeOriginatedTxs: BridgeOriginatedItem[] = []; // Use specific type

  if (bridgeHistory) {
    Object.entries(bridgeHistory).forEach(([_id, bridgeTx]) => {
      // Limit to bridge operations started within the last 24 hours.
      const isRecent =
        bridgeTx.startTime &&
        Date.now() - bridgeTx.startTime < 24 * 60 * 60 * 1000;

      if (isRecent) {
        const srcTxHash = bridgeTx.status?.srcChain?.txHash;
        // Check if a transaction with the same source hash already exists in the main list.
        const existsInTxList = nonEvmTransactions.transactions.some(
          (tx) => tx.id === srcTxHash, // Check against combined list
        );

        // If it doesn't exist and we have a hash, create a new BridgeOriginatedItem entry for it.
        if (!existsInTxList && srcTxHash) {
          const timestampSeconds =
            ((bridgeTx.status?.status === 'COMPLETE'
              ? bridgeTx.completionTime ?? bridgeTx.startTime
              : bridgeTx.startTime) ?? Date.now()) / 1000;

          // Determine the chain identifier using type guard.
          const rawChainId = bridgeTx.quote?.srcChainId;
          const chainId: CaipChainId = isCaipChainId(rawChainId)
            ? rawChainId
            : MultichainNetworks.SOLANA; // Default to Solana if invalid/missing

          // Determine the native asset type (CAIP-19) for the determined chainId.
          const assetType: CaipAssetType =
            ((
              MULTICHAIN_NATIVE_CURRENCY_TO_CAIP19 as Record<
                CaipChainId,
                string
              >
            )[chainId] as CaipAssetType) ?? 'eip155:1/slip44:60'; // Default to ETH native asset type if chainId not found

          // Create the BridgeOriginatedItem without base Transaction fields.
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
            isBridgeTx: true, // Assume originated are bridge transactions initially.
            bridgeInfo: undefined, // Populated later.
            // NO status, chain, events, fees added here.
          };
          bridgeOriginatedTxs.push(bridgeOriginatedTx);
        }
      }
    });
  }

  // Add the newly created bridge-originated transactions to the main list.
  if (bridgeOriginatedTxs.length > 0) {
    nonEvmTransactions = {
      ...nonEvmTransactions,
      transactions: [
        ...nonEvmTransactions.transactions,
        ...bridgeOriginatedTxs,
      ],
    };
  }

  // If there are no transactions at all (neither initial nor originated), return early.
  if (!nonEvmTransactions.transactions.length) {
    return initialNonEvmTransactions === undefined &&
      bridgeOriginatedTxs.length === 0
      ? undefined
      : nonEvmTransactions;
  }

  // Map through all transactions (original + originated) to add bridge details.
  const modifiedTransactions: (ExtendedTransaction | BridgeOriginatedItem)[] =
    nonEvmTransactions.transactions.map((tx) => {
      const txSignature = tx.id;

      // Swaps are handled differently (Swaps should be ExtendedTransaction type).
      if (tx.type === 'swap' && !tx.isBridgeOriginated) {
        // Ensure it conforms to ExtendedTransaction (isBridgeOriginated defaults/is false)
        return {
          ...(tx as ExtendedTransaction),
          isBridgeTx: false,
          isBridgeOriginated: false,
        };
      }

      // Look for a matching entry in the bridge history using the transaction signature/ID.
      const matchingBridgeTx = txSignature
        ? bridgeTxSignatures[txSignature]
        : null;

      // Case 1: Transaction found in bridge history (could be original or originated).
      if (matchingBridgeTx) {
        const srcChainId = matchingBridgeTx.quote?.srcChainId;
        const destChainId = matchingBridgeTx.quote?.destChainId;
        // It's a true bridge transaction if source and destination chains differ.
        const isBridgeTx =
          srcChainId !== undefined &&
          destChainId !== undefined &&
          srcChainId !== destChainId;

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

        // If the original tx was bridge originated, return BridgeOriginatedItem
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
            isBridgeTx,
            bridgeInfo,
          } as BridgeOriginatedItem;
        }
        // Otherwise, return ExtendedTransaction
        return {
          ...(tx as ExtendedTransaction),
          isBridgeTx,
          bridgeInfo,
          isBridgeOriginated: false,
        };
      }

      // Case 2: Transaction originated from bridge history but somehow wasn't matched above.
      if (tx.isBridgeOriginated) {
        // Return as BridgeOriginatedItem, but mark as not a bridge and clear info
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

      // Case 3: Default - Transaction is not a swap, not found in bridge history, and not originated from it.
      // Ensure it conforms to ExtendedTransaction
      return {
        ...(tx as ExtendedTransaction),
        isBridgeTx: false,
        isBridgeOriginated: false,
      };
    });

  // Return the final data structure with the list of modified transactions.
  return {
    ...nonEvmTransactions,
    transactions: modifiedTransactions,
  };
}
