import { useCallback } from 'react';
import { useStore } from 'react-redux';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import {
  PermissionTypesWithCustom,
  Signer,
  StoredGatorPermissionSanitized,
} from '@metamask/gator-permissions-controller';
import {
  addTransaction,
  findNetworkClientIdByChainId,
} from '../../store/actions';
import { getMemoizedInternalAccountByAddress } from '../../selectors/accounts';
import { encodeDisableDelegation } from '../../../shared/lib/delegation/delegation';
import { addPendingRevocation } from '../../store/controller-actions/gator-permissions-controller';
import { extractDelegationFromGatorPermissionContext } from './utils';
import { useGatorPermissionRedirect } from './useGatorPermissionRedirect';

export type RevokeGatorPermissionsMultiChainResults = Record<
  Hex,
  {
    revoked: TransactionMeta[];
    skipped: StoredGatorPermissionSanitized<
      Signer,
      PermissionTypesWithCustom
    >[];
    errors: Error[];
  }
>;

/**
 * Hook for revoking gator permissions across multiple chains.
 * This is a specialized hook for handling multi-chain revocation scenarios,
 * such as disconnecting from a site that has permissions on multiple networks.
 *
 * @param params - The parameters for revoking gator permissions
 * @param params.onRedirect - Optional callback to call when redirect is pending
 * @returns The function to revoke gator permissions across multiple chains
 */
export function useRevokeGatorPermissionsMultiChain({
  onRedirect,
}: {
  onRedirect?: () => void;
} = {}) {
  const { setTransactionId } = useGatorPermissionRedirect({ onRedirect });
  const store = useStore();

  /**
   * Revokes gator permissions across multiple chains.
   * Processes permissions for each chain independently, continuing even if one chain fails.
   *
   * @param permissionsByChain - Object mapping chain IDs to arrays of permissions for that chain.
   * @returns Promise resolving to object mapping chain IDs to results (revoked transactions, skipped permissions, errors).
   */
  const revokeGatorPermissionsBatchMultiChain = useCallback(
    async (
      permissionsByChain: Record<
        Hex,
        StoredGatorPermissionSanitized<Signer, PermissionTypesWithCustom>[]
      >,
    ): Promise<RevokeGatorPermissionsMultiChainResults> => {
      const results: RevokeGatorPermissionsMultiChainResults = {};
      const allTransactionIds: string[] = [];

      for (const [currentChainId, permissions] of Object.entries(
        permissionsByChain,
      )) {
        results[currentChainId as Hex] = {
          revoked: [],
          skipped: [],
          errors: [],
        };

        if (permissions.length === 0) {
          continue;
        }

        // Get network client ID for this chain
        let networkClientId: string;

        try {
          networkClientId = await findNetworkClientIdByChainId(currentChainId);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          results[currentChainId as Hex].errors.push(
            new Error(
              `No network client ID found for chain ${currentChainId}: ${errorMessage}`,
            ),
          );
          continue;
        }

        // Process each permission for this chain
        for (const permission of permissions) {
          try {
            const { permissionResponse } = permission;
            const internalAccount = getMemoizedInternalAccountByAddress(
              store.getState(),
              permissionResponse.address as Hex,
            );

            if (!internalAccount) {
              results[currentChainId as Hex].skipped.push(permission);
              continue;
            }

            // Extract delegation
            const delegation = extractDelegationFromGatorPermissionContext(
              permissionResponse.context,
            );

            // Encode disable delegation call
            const encodedCallData = encodeDisableDelegation({ delegation });

            // Create transaction
            const transactionMeta = await addTransaction(
              {
                from: internalAccount.address as Hex,
                to: permissionResponse.signerMeta.delegationManager,
                data: encodedCallData,
                value: '0x0',
              },
              {
                networkClientId,
                type: TransactionType.contractInteraction,
              },
            );

            if (!transactionMeta) {
              throw new Error('No transaction meta found');
            }

            if (!transactionMeta.id) {
              throw new Error('No transaction id found');
            }

            results[currentChainId as Hex].revoked.push(transactionMeta);
            allTransactionIds.push(transactionMeta.id);
            await addPendingRevocation({
              txId: transactionMeta.id,
              permissionContext: permissionResponse.context,
            });
          } catch (error) {
            results[currentChainId as Hex].errors.push(error as Error);
          }
        }
      }

      // Update transaction IDs for redirect handling
      if (allTransactionIds.length > 0) {
        setTransactionId(allTransactionIds[0]);
      }

      return results;
    },
    [store, setTransactionId],
  );

  return {
    revokeGatorPermissionsBatchMultiChain,
  };
}
