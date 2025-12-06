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
import { getMemoizedInternalAccountByAddress } from '../../selectors/accounts';
import {
  addTransaction,
  findNetworkClientIdByChainId,
} from '../../store/actions';
import {
  encodeDisableDelegation,
  getDelegationHashOffchain,
} from '../../../shared/lib/delegation/delegation';
import {
  addPendingRevocation,
  submitDirectRevocation,
  checkDelegationDisabled,
} from '../../store/controller-actions/gator-permissions-controller';
import { useGatorPermissionRedirect } from './useGatorPermissionRedirect';
import { extractDelegationFromGatorPermissionContext } from './utils';

export type RevokeGatorPermissionArgs = {
  accountAddress: Hex;
  permissionContext: Hex;
  delegationManagerAddress: Hex;
};

/**
 * Hook for revoking gator permissions.
 *
 * @param params - The parameters for revoking gator permissions
 * @param params.chainId - The chain ID used for validation to ensure all permissions are on the same chain. The actual chainId used for each transaction is extracted from the permission itself.
 * @param params.onRedirect - The callback to call when the redirect is pending
 * @returns The functions to revoke a gator permission and a batch of gator permissions
 */
export function useRevokeGatorPermissions({
  chainId,
  onRedirect,
}: {
  chainId: Hex;
  onRedirect?: () => void;
}) {
  const { setTransactionId } = useGatorPermissionRedirect({ onRedirect });
  const store = useStore();

  /**
   * Asserts that the gator permission(s) is not empty.
   * When an single permission is provided, empty means undefined.
   * When an array of permissions is provided, empty means an empty array.
   *
   * @param dataToAssert - The gator permission(s) to assert.
   * @throws An error if the gator permission(s) is empty.
   */
  const assertNotEmptyGatorPermission = useCallback(
    (
      dataToAssert:
        | StoredGatorPermissionSanitized<Signer, PermissionTypesWithCustom>
        | StoredGatorPermissionSanitized<Signer, PermissionTypesWithCustom>[],
    ) => {
      if (Array.isArray(dataToAssert)) {
        if (dataToAssert.length === 0) {
          throw new Error('No gator permissions provided');
        }

        // Make sure all gator permissions are not empty
        for (const gatorPermission of dataToAssert) {
          assertNotEmptyGatorPermission(gatorPermission);
        }
      } else if (!dataToAssert) {
        throw new Error('No gator permission provided');
      }
    },
    [],
  );

  /**
   * Asserts that the chain ID of the gator permission matches the chain ID of the hook.
   *
   * @param gatorPermission - The gator permission to assert.
   * @throws An error if the chain ID does not match.
   */
  const assertCorrectChainId = useCallback(
    (
      gatorPermission: StoredGatorPermissionSanitized<
        Signer,
        PermissionTypesWithCustom
      >,
    ) => {
      if (gatorPermission.permissionResponse.chainId !== chainId) {
        throw new Error('Chain ID does not match');
      }
    },
    [chainId],
  );

  /**
   * Builds the arguments for revoking a gator permission.
   *
   * @param gatorPermission - The gator permission to revoke.
   * @returns The arguments for revoking a gator permission.
   */
  const buildRevokeGatorPermissionArgs = useCallback(
    (
      gatorPermission: StoredGatorPermissionSanitized<
        Signer,
        PermissionTypesWithCustom
      >,
    ): RevokeGatorPermissionArgs => {
      const { permissionResponse } = gatorPermission;
      const internalAccount = getMemoizedInternalAccountByAddress(
        store.getState(),
        permissionResponse.address as Hex,
      );
      if (!internalAccount) {
        throw new Error(
          'Internal account not found for delegator of permission',
        );
      }
      return {
        permissionContext: permissionResponse.context,
        delegationManagerAddress:
          permissionResponse.signerMeta.delegationManager,
        accountAddress: internalAccount.address as Hex,
      };
    },
    [store],
  );

  /**
   * Adds a new unapproved transaction to revoke a gator permission to the confirmation queue.
   *
   * @param gatorPermission - The gator permission to revoke.
   * @returns The transaction meta for the revoked gator permission, or null if already disabled.
   */
  const addRevokeGatorPermissionTransaction = useCallback(
    async (
      gatorPermission: StoredGatorPermissionSanitized<
        Signer,
        PermissionTypesWithCustom
      >,
    ): Promise<TransactionMeta | null> => {
      const permissionChainId = gatorPermission.permissionResponse.chainId;

      let networkClientId: string;
      try {
        networkClientId = await findNetworkClientIdByChainId(permissionChainId);
      } catch (error) {
        throw new Error(
          `Failed to find network client for chain ${permissionChainId}`,
          { cause: error },
        );
      }

      const { permissionContext, delegationManagerAddress, accountAddress } =
        buildRevokeGatorPermissionArgs(gatorPermission);

      const delegation =
        extractDelegationFromGatorPermissionContext(permissionContext);

      const delegationHash = getDelegationHashOffchain(delegation);

      const isDisabled = await checkDelegationDisabled(
        delegationManagerAddress,
        delegationHash,
        networkClientId,
      );

      if (isDisabled) {
        await submitDirectRevocation({ permissionContext });
        return null;
      }

      const encodedCallData = encodeDisableDelegation({
        delegation,
      });

      const transactionMeta = await addTransaction(
        {
          from: accountAddress,
          to: delegationManagerAddress,
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

      await addPendingRevocation({
        txId: transactionMeta.id,
        permissionContext,
      });

      return transactionMeta;
    },
    [buildRevokeGatorPermissionArgs],
  );

  /**
   * Revokes a single gator permission.
   *
   * @param gatorPermission - The gator permission to revoke.
   * @returns The transaction meta for the revoked gator permission, or null if already disabled.
   * @throws An error if no gator permission is provided.
   * @throws An error if the chain ID does not match the chain ID of the hook.
   */
  const revokeGatorPermission = useCallback(
    async (
      gatorPermission: StoredGatorPermissionSanitized<
        Signer,
        PermissionTypesWithCustom
      >,
    ): Promise<TransactionMeta | null> => {
      assertNotEmptyGatorPermission(gatorPermission);
      assertCorrectChainId(gatorPermission);
      const transactionMeta =
        await addRevokeGatorPermissionTransaction(gatorPermission);

      setTransactionId(transactionMeta?.id);

      return transactionMeta;
    },
    [
      addRevokeGatorPermissionTransaction,
      assertCorrectChainId,
      assertNotEmptyGatorPermission,
      setTransactionId,
    ],
  );

  /**
   * Revokes a batch of gator permissions sequentially on the same chain.
   *
   * @param gatorPermissions - The gator permissions to revoke.
   * @returns The transaction metas for the revoked gator permissions (null entries are filtered out for already-disabled permissions).
   * @throws An error if no gator permissions are provided.
   * @throws An error if the chain ID does not match the chain ID of the hook.
   */
  const revokeGatorPermissionBatch = useCallback(
    async (
      gatorPermissions: StoredGatorPermissionSanitized<
        Signer,
        PermissionTypesWithCustom
      >[],
    ): Promise<TransactionMeta[]> => {
      assertNotEmptyGatorPermission(gatorPermissions);

      // Make sure all gator permissions are on the same chain before revoking
      for (const gatorPermission of gatorPermissions) {
        assertCorrectChainId(gatorPermission);
      }

      // TODO: This is a temporary solution to revoke gator permissions sequentially
      // We want to replace this with a batch 7702 transaction
      // so the user does not need to sequentially sign transactions
      const revokeTransactionMetas: (TransactionMeta | null)[] = [];
      for (const gatorPermission of gatorPermissions) {
        const transactionMeta =
          await addRevokeGatorPermissionTransaction(gatorPermission);
        revokeTransactionMetas.push(transactionMeta);
      }

      // Filter out null entries (already-disabled permissions)
      const validTransactionMetas = revokeTransactionMetas.filter(
        (meta): meta is TransactionMeta => meta !== null,
      );

      setTransactionId(validTransactionMetas[0]?.id);

      return validTransactionMetas;
    },
    [
      addRevokeGatorPermissionTransaction,
      assertCorrectChainId,
      assertNotEmptyGatorPermission,
      setTransactionId,
    ],
  );

  return {
    revokeGatorPermission,
    revokeGatorPermissionBatch,
  };
}
