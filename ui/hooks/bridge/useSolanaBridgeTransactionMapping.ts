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
      if (bridgeTx.status?.srcChain?.txHash) {
        // @ts-expect-error WIP: Need to add index signature to bridgeTxSignatures
        bridgeTxSignatures[bridgeTx.status.srcChain.txHash] = bridgeTx;
      }
    });
  }

  // No transactions to process
  if (!nonEvmTransactions?.transactions?.length) {
    return nonEvmTransactions;
  }

  // Create a modified copy with bridge info added
  const modifiedTransactions = nonEvmTransactions.transactions.map((tx) => {
    // The signature is in the id field for non-EVM transactions
    const txSignature = tx.id;

    // If the transaction type is explicitly 'swap', never mark it as a bridge
    if (tx.type === 'swap') {
      return {
        ...tx,
        // Explicitly set to false to ensure it's never marked as a bridge
        isBridgeTx: false,
      };
    }

    // Check if this transaction signature matches a bridge transaction
    if (
      txSignature &&
      // @ts-expect-error WIP: Need to add index signature to bridgeTxSignatures
      bridgeTxSignatures[txSignature]
    ) {
      // @ts-expect-error WIP: Need to add index signature to bridgeTxSignatures
      const matchingBridgeTx = bridgeTxSignatures[txSignature];

      // Get source and destination chain IDs
      const srcChainId = matchingBridgeTx.quote?.srcChainId;
      const destChainId = matchingBridgeTx.quote?.destChainId;

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
        // Include destination chain details
        bridgeInfo: isBridgeTx
          ? {
              destChainId: matchingBridgeTx.quote?.destChainId,
              destChainName: getNetworkName(
                matchingBridgeTx.quote?.destChainId,
              ),
              destAsset: matchingBridgeTx.quote?.destAsset,
              destTokenAmount: matchingBridgeTx.quote?.destTokenAmount,
            }
          : undefined,
      };
    }

    // Return the original transaction unchanged if not a bridge transaction
    return tx;
  });

  // Return a modified copy of the original transactions with bridge info
  return {
    ...nonEvmTransactions,
    transactions: modifiedTransactions,
  };
}
