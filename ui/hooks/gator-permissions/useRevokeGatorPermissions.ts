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
import { addTransaction } from '../../store/actions';
import {
  getInternalAccounts,
  selectDefaultRpcEndpointByChainId,
} from '../../selectors';
import { useConfirmationNavigation } from '../../pages/confirmations/hooks/useConfirmationNavigation';
import {
  encodeDisableDelegation,
  Delegation,
} from '../../../shared/lib/delegation/delegation';
import { isEqualCaseInsensitive } from '../../../shared/modules/string-utils';

export type RevokeGatorPermissionArgs = {
  accountAddress: Hex;
  permissionContext: Hex;
  delegationManagerAddress: Hex;
};

/**
 * Hook for revoking gator permissions.
 *
 * @param params - The parameters for revoking gator permissions
 * @param params.chainId - The chain ID of the gator permission to revoke
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
  const [transactionId, setTransactionId] = useState<string | undefined>();
  const { confirmations, navigateToId } = useConfirmationNavigation();
  const internalAccounts = useSelector(getInternalAccounts);
  const defaultRpcEndpoint = useSelector((state) =>
    selectDefaultRpcEndpointByChainId(state, chainId),
  );

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
   * Returns the default RPC endpoint.
   *
   * @returns The default RPC endpoint.
   * @throws An error if no default RPC endpoint is found.
   */
  const getDefaultRpcEndpoint = useCallback(() => {
    if (!defaultRpcEndpoint) {
      throw new Error('No default RPC endpoint found');
    }
    return defaultRpcEndpoint;
  }, [defaultRpcEndpoint]);

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
      const internalAccount = findInternalAccountByAddress(
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
    [findInternalAccountByAddress],
  );

  /**
   * Adds a new unapproved transaction to revoke a gator permission to the confirmation queue.
   *
   * @param gatorPermission - The gator permission to revoke.
   * @returns The transaction meta for the revoked gator permission.
   */
  const addRevokeGatorPermissionTransaction = useCallback(
    async (
      gatorPermission: StoredGatorPermissionSanitized<
        Signer,
        PermissionTypesWithCustom
      >,
    ) => {
      const { networkClientId } = getDefaultRpcEndpoint();
      const { permissionContext, delegationManagerAddress, accountAddress } =
        buildRevokeGatorPermissionArgs(gatorPermission);

      const delegation =
        extractDelegationFromGatorPermissionContext(permissionContext);

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

      return transactionMeta;
    },
    [
      getDefaultRpcEndpoint,
      buildRevokeGatorPermissionArgs,
      extractDelegationFromGatorPermissionContext,
    ],
  );

  /**
   * Revokes a single gator permission.
   *
   * @param gatorPermission - The gator permission to revoke.
   * @returns The transaction meta for the revoked gator permission.
   * @throws An error if no gator permission is provided.
   * @throws An error if the chain ID does not match the chain ID of the hook.
   */
  const revokeGatorPermission = useCallback(
    async (
      gatorPermission: StoredGatorPermissionSanitized<
        Signer,
        PermissionTypesWithCustom
      >,
    ): Promise<TransactionMeta> => {
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
    ],
  );

  /**
   * Revokes a batch of gator permissions sequentially on the same chain.
   *
   * @param gatorPermissions - The gator permissions to revoke.
   * @returns The transaction metas for the revoked gator permissions.
   * @throws An error if no gator permissions are provided.
   * @throws An error if the chain ID does not match the chain ID of the hook.
   * @throws An error if no transactions to add to batch.
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
      const revokeTransactionMetas: TransactionMeta[] = [];
      for (const gatorPermission of gatorPermissions) {
        const transactionMeta =
          await addRevokeGatorPermissionTransaction(gatorPermission);
        revokeTransactionMetas.push(transactionMeta);
      }

      setTransactionId(revokeTransactionMetas[0]?.id);

      return revokeTransactionMetas;
    },
    [
      addRevokeGatorPermissionTransaction,
      assertCorrectChainId,
      assertNotEmptyGatorPermission,
    ],
  );

  useEffect(() => {
    if (isRedirectPending) {
      navigateToId(transactionId);
      onRedirect?.();
    }
  }, [isRedirectPending, navigateToId, transactionId, onRedirect]);

  return {
    revokeGatorPermission,
    revokeGatorPermissionBatch,
    findInternalAccountByAddress,
  };
}
