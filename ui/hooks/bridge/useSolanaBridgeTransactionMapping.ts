import { useSelector } from 'react-redux';
import { Transaction } from '@metamask/keyring-api';
import { Numeric, NumericValue } from '../../../shared/modules/Numeric';
import { NETWORK_TO_NAME_MAP } from '../../../shared/constants/network';
import { MULTICHAIN_PROVIDER_CONFIGS } from '../../../shared/constants/multichain/networks';
import { selectBridgeHistoryForAccount } from '../../ducks/bridge-status/selectors';

/**
 * Hook to map Solana bridge transactions with EVM destination info
 *
 * @param nonEvmTransactions - The non-EVM transactions to process
 * @returns Enhanced non-EVM transactions with bridging information
 */
export default function useSolanaBridgeTransactionMapping(
  nonEvmTransactions:
    | { transactions: Transaction[]; next: string | null; lastUpdated: number }
    | undefined,
) {
  // Get bridge transactions from the bridge status controller
  const bridgeHistory = useSelector(selectBridgeHistoryForAccount);

  /**
   * Gets a human-readable network name from a chain ID
   *
   * @param chainId - The chain ID to resolve (can be decimal or hex)
   * @returns The network name or the original chain ID if not found
   */
  const getNetworkName = (chainId: NumericValue) => {
    // First check if it's in the MULTICHAIN_PROVIDER_CONFIGS (for non-EVM chains)
    // @ts-expect-error WIP: Need to fix type for indexing MULTICHAIN_PROVIDER_CONFIGS with NumericValue
    let networkName = MULTICHAIN_PROVIDER_CONFIGS[chainId]?.nickname;

    // If not found and it might be an EVM chain ID, convert to hex and check NETWORK_TO_NAME_MAP
    if (!networkName && !isNaN(Number(chainId))) {
      try {
        // Convert decimal to hex with '0x' prefix
        const hexChainId = new Numeric(chainId, 10).toPrefixedHexString();
        // @ts-expect-error WIP: Need to fix type for indexing NETWORK_TO_NAME_MAP with string
        networkName = NETWORK_TO_NAME_MAP[hexChainId];
      } catch (e) {
        // If conversion fails, just use the original chain ID
        console.error('Error converting chain ID', e);
      }
    }

    // Return the network name or the original chain ID if no mapping found
    return networkName || chainId;
  };

  // Create a map of bridge transaction signatures for quick lookups
  const bridgeTxSignatures = {};
  if (bridgeHistory) {
    Object.values(bridgeHistory).forEach((bridgeTx) => {
      // For Solana transactions, we need to check both options for where the source tx hash might be
      const possibleTxHashes = [
        bridgeTx.srcTxHash, // Direct property
        bridgeTx.status?.srcChain?.txHash, // Nested in status object
      ].filter(Boolean); // Filter out undefined/null values

      // Add entries for each possible tx hash
      possibleTxHashes.forEach((txHash) => {
        if (txHash) {
          // @ts-expect-error WIP: Need to add index signature to bridgeTxSignatures
          bridgeTxSignatures[txHash] = bridgeTx;
        }
      });
    });
  }

  // No transactions to process
  if (!nonEvmTransactions?.transactions?.length) {
    return nonEvmTransactions;
  }

  // Create synthetic transactions for bridge transactions that might not be in the non-EVM transactions list
  // These are transactions from the bridge history that we want to make sure are displayed
  const syntheticBridgeTxs: Transaction[] = [];

  if (bridgeHistory) {
    // Loop through all bridge history entries
    Object.entries(bridgeHistory).forEach(([id, bridgeTx]) => {
      // Check if this is a recent transaction (last 24 hours)
      const isRecent =
        bridgeTx.startTime &&
        Date.now() - bridgeTx.startTime < 24 * 60 * 60 * 1000;

      if (isRecent) {
        // Get the source transaction hash
        const srcTxHash =
          bridgeTx.srcTxHash || bridgeTx.status?.srcChain?.txHash;

        // Check if this transaction is already in the nonEvmTransactions list
        const existsInTxList = nonEvmTransactions?.transactions?.some(
          (tx) => tx.id === srcTxHash || tx.hash === srcTxHash,
        );

        // If it's not already in the list, create a synthetic transaction
        if (!existsInTxList && srcTxHash) {
          // Create a minimal synthetic transaction object with the necessary fields
          const syntheticTx: Transaction = {
            id: srcTxHash,
            account: bridgeTx.account,
            // Use completionTime for completed transactions, otherwise use startTime
            // This ensures completed transactions sort correctly
            timestamp:
              bridgeTx.status === 'COMPLETE' ||
              bridgeTx.status?.status === 'COMPLETE'
                ? (bridgeTx.completionTime || bridgeTx.startTime) / 1000
                : bridgeTx.startTime / 1000, // Convert to seconds for consistency
            hash: srcTxHash,
            type: 'bridge',
            // Add minimal required fields
            to: [],
            from: [
              {
                address: bridgeTx.account,
                asset: {
                  amount: (
                    Number(bridgeTx.quote?.srcTokenAmount) /
                    10 ** (bridgeTx.quote?.srcAsset?.decimals || 9)
                  ).toString(),
                  unit: bridgeTx.quote?.srcAsset?.symbol || 'SOL',
                  fungible: true,
                },
              },
            ],
            // Adding synthetic flag to identify these transactions
            synthetic: true,
            // Adding status information directly on the transaction
            bridgeStatus: bridgeTx.status || bridgeTx.status?.status,
          };

          syntheticBridgeTxs.push(syntheticTx);
        }
      }
    });
  }

  // If we have synthetic transactions, add them to the transactions list
  if (syntheticBridgeTxs.length > 0) {
    if (!nonEvmTransactions) {
      // Create a new transactions object if none exists
      nonEvmTransactions = {
        transactions: [],
        next: null,
        lastUpdated: Date.now(),
      };
    }
    nonEvmTransactions = {
      ...nonEvmTransactions,
      transactions: [...nonEvmTransactions.transactions, ...syntheticBridgeTxs],
    };
  }

  // Create a modified copy with bridge info added
  const modifiedTransactions = nonEvmTransactions.transactions.map((tx) => {
    // The signature is in the id field for non-EVM transactions
    const txSignature = tx.id;
    // Also check tx.hash which might contain the signature in some cases
    const txHash = tx.hash;

    // If the transaction type is explicitly 'swap', never mark it as a bridge
    if (tx.type === 'swap') {
      return {
        ...tx,
        // Explicitly set to false to ensure it's never marked as a bridge
        isBridgeTx: false,
      };
    }

    // If the transaction type is already 'bridge' (from a synthetic transaction),
    // try to find its matching bridge history entry
    if (tx.type === 'bridge') {
      // Find the matching bridge history entry by txMetaId
      const matchingBridgeTxEntry = Object.entries(bridgeHistory).find(
        ([_, entry]) =>
          entry.srcTxHash === txSignature ||
          entry.status?.srcChain?.txHash === txSignature,
      );

      if (matchingBridgeTxEntry) {
        const [_, matchingBridgeTx] = matchingBridgeTxEntry;

        // Get source and destination chain IDs, handle both possible data structures
        const srcChainId =
          matchingBridgeTx.srcChainId || matchingBridgeTx.quote?.srcChainId;
        const destChainId =
          matchingBridgeTx.destChainId || matchingBridgeTx.quote?.destChainId;

        return {
          ...tx,
          isBridgeTx: true,
          bridgeInfo: {
            destChainId,
            destChainName: getNetworkName(destChainId),
            destAsset: {
              ...(matchingBridgeTx.destAsset ||
                matchingBridgeTx.quote?.destAsset ||
                {}),
              decimals:
                matchingBridgeTx.destAsset?.decimals ||
                matchingBridgeTx.quote?.destAsset?.decimals ||
                18,
            },
            destTokenAmount:
              matchingBridgeTx.destTokenAmount ||
              matchingBridgeTx.quote?.destTokenAmount,
            status:
              // Direct status property (string) takes precedence
              typeof matchingBridgeTx.status === 'string'
                ? matchingBridgeTx.status
                : // Then status.status if it exists
                  matchingBridgeTx.status?.status ||
                  // Default to 'PENDING' if no status found
                  'PENDING',
            destTxHash:
              matchingBridgeTx.destTxHash ||
              matchingBridgeTx.status?.destChain?.txHash,
            srcTxHash:
              matchingBridgeTx.srcTxHash ||
              matchingBridgeTx.status?.srcChain?.txHash,
            provider:
              matchingBridgeTx.provider || matchingBridgeTx.quote?.provider,
            destBlockExplorerUrl:
              matchingBridgeTx.destBlockExplorerUrl ||
              matchingBridgeTx.quote?.destChain?.blockExplorerUrl,
          },
        };
      }
    }

    // Check if this transaction signature matches a bridge transaction
    // First check txSignature (tx.id), then fall back to txHash (tx.hash)
    const matchingSignature =
      txSignature && bridgeTxSignatures[txSignature]
        ? txSignature
        : txHash && bridgeTxSignatures[txHash]
        ? txHash
        : null;

    if (matchingSignature) {
      // @ts-expect-error WIP: Need to add index signature to bridgeTxSignatures
      const matchingBridgeTx = bridgeTxSignatures[matchingSignature];

      // Get source and destination chain IDs, handle both possible data structures
      const srcChainId =
        matchingBridgeTx.srcChainId || matchingBridgeTx.quote?.srcChainId;
      const destChainId =
        matchingBridgeTx.destChainId || matchingBridgeTx.quote?.destChainId;

      // Only consider it a bridge if source and destination chains are different
      const isBridgeTx =
        srcChainId && destChainId && srcChainId !== destChainId;

      // Return an enhanced version of the transaction with bridge info
      return {
        ...tx,
        // Change the type to bridge only if it's truly a bridge transaction
        type: isBridgeTx ? 'bridge' : tx.type,
        // Add bridge-specific flag based on chain comparison
        isBridgeTx,
        // Include destination chain details - handle both possible data structures
        bridgeInfo: isBridgeTx
          ? {
              destChainId,
              destChainName: getNetworkName(destChainId),
              destAsset: {
                ...(matchingBridgeTx.destAsset ||
                  matchingBridgeTx.quote?.destAsset ||
                  {}),
                // Ensure decimals is always available for the destination asset
                decimals:
                  matchingBridgeTx.destAsset?.decimals ||
                  matchingBridgeTx.quote?.destAsset?.decimals ||
                  18,
              },
              destTokenAmount:
                matchingBridgeTx.destTokenAmount ||
                matchingBridgeTx.quote?.destTokenAmount,
              // Add status information for UI display
              status:
                // Direct status property (string) takes precedence
                typeof matchingBridgeTx.status === 'string'
                  ? matchingBridgeTx.status
                  : // Then status.status if it exists
                    matchingBridgeTx.status?.status ||
                    // Default to 'PENDING' if no status found
                    'PENDING',
              destTxHash:
                matchingBridgeTx.destTxHash ||
                matchingBridgeTx.status?.destChain?.txHash,
              srcTxHash:
                matchingBridgeTx.srcTxHash ||
                matchingBridgeTx.status?.srcChain?.txHash,
              provider:
                matchingBridgeTx.provider || matchingBridgeTx.quote?.provider,
              // Add block explorer URL for destination chain based on chainId if available
              destBlockExplorerUrl:
                matchingBridgeTx.destBlockExplorerUrl ||
                matchingBridgeTx.quote?.destChain?.blockExplorerUrl,
            }
          : undefined,
      };
    }

    // Return the original transaction unchanged if not a bridge transaction
    return tx;
  });

  // Return the modified transactions with bridge info added

  // Return a modified copy of the original transactions with bridge info
  return {
    ...nonEvmTransactions,
    transactions: modifiedTransactions,
  };
}
