import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { decodeDelegations } from '@metamask/delegation-core';
import {
  PermissionTypesWithCustom,
  Signer,
  StoredGatorPermissionSanitized,
} from '@metamask/gator-permissions-controller';
import {
  addTransaction,
  findNetworkClientIdByChainId,
} from '../../store/actions';
import { getInternalAccounts } from '../../selectors';
import { useConfirmationNavigation } from '../../pages/confirmations/hooks/useConfirmationNavigation';
import {
  encodeDisableDelegation,
  Delegation,
} from '../../../shared/lib/delegation/delegation';
import { isEqualCaseInsensitive } from '../../../shared/modules/string-utils';

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
  const [transactionId, setTransactionId] = useState<string | undefined>();
  const { confirmations, navigateToId } = useConfirmationNavigation();
  const internalAccounts = useSelector(getInternalAccounts);

  const isRedirectPending = confirmations.some(
    (conf) => conf.id === transactionId,
  );

  /**
   * Extracts the delegation from the gator permission encoded context.
   *
   * @param permissionContext - The gator permission context to extract the delegation from.
   * @returns The delegation.
   * @throws An error if no delegation is found.
   */
  const extractDelegationFromGatorPermissionContext = useCallback(
    (permissionContext: Hex): Delegation => {
      // Gator 7715 permissions only have a single signed delegation:
      const delegations = decodeDelegations(permissionContext);
      const firstDelegation = delegations[0];
      if (!firstDelegation) {
        throw new Error('No delegation found');
      }

      if (delegations.length !== 1) {
        throw new Error('Multiple delegations found');
      }

      return {
        ...firstDelegation,
        salt: `0x${firstDelegation.salt.toString(16)}`,
      };
    },
    [],
  );

  /**
   * Finds an internal account by its address that matches the delegator of the gator permission.
   *
   * @param delegator - The address of the delegator to find.
   * @returns The internal account if found, otherwise undefined.
   */
  const findInternalAccountByAddress = useCallback(
    (delegator: Hex) => {
      return internalAccounts.find((account) =>
        isEqualCaseInsensitive(account.address, delegator),
      );
    },
    [internalAccounts],
  );

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

      // Process each chain
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
            const internalAccount = findInternalAccountByAddress(
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

            if (transactionMeta?.id) {
              results[currentChainId as Hex].revoked.push(transactionMeta);
              allTransactionIds.push(transactionMeta.id);
            }
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
    [
      extractDelegationFromGatorPermissionContext,
      findInternalAccountByAddress,
      setTransactionId,
    ],
  );

  useEffect(() => {
    if (isRedirectPending) {
      navigateToId(transactionId);
      onRedirect?.();
    }
  }, [isRedirectPending, navigateToId, transactionId, onRedirect]);

  return {
    revokeGatorPermissionsBatchMultiChain,
  };
}
