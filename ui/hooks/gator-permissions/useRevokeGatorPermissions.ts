import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { decodeDelegations } from '@metamask/delegation-core';
import {
  PermissionTypes,
  SignerParam,
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

  const isRedirectPending = useMemo(() => {
    return confirmations.some((conf) => conf.id === transactionId);
  }, [confirmations, transactionId]);

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
      // https://github.com/MetaMask/snap-7715-permissions/blob/main/packages/gator-permissions-snap/src/core/permissionRequestLifecycleOrchestrator.ts#L259
      const delegations = decodeDelegations(permissionContext);
      const firstDelegation = delegations[0];
      if (!firstDelegation) {
        throw new Error('No delegation found');
      }

      return {
        ...firstDelegation,
        salt: `0x${firstDelegation.salt.toString(16)}`,
      };
    },
    [],
  );

  /**
   * Asserts that a default RPC endpoint is available.
   *
   * @returns The default RPC endpoint.
   * @throws An error if no default RPC endpoint is found.
   */
  const assertDefaultRpcEndpoint = useCallback(() => {
    if (!defaultRpcEndpoint) {
      throw new Error('No default RPC endpoint found');
    }
    return defaultRpcEndpoint;
  }, [defaultRpcEndpoint]);

  /**
   * Asserts that the gator permission(s) is not empty.
   *
   * @param dataToAssert - The gator permission(s) to assert.
   * @throws An error if the gator permission(s) is empty.
   */
  const assertEmptyGatorPermission = useCallback(
    (
      dataToAssert:
        | StoredGatorPermissionSanitized<SignerParam, PermissionTypes>
        | StoredGatorPermissionSanitized<SignerParam, PermissionTypes>[],
    ) => {
      if (Array.isArray(dataToAssert)) {
        if (dataToAssert.length === 0) {
          throw new Error('No gator permissions provided');
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
  const assertChainId = useCallback(
    (
      gatorPermission: StoredGatorPermissionSanitized<
        SignerParam,
        PermissionTypes
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
  const findDelegatorFromInternalAccounts = useCallback(
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
        SignerParam,
        PermissionTypes
      >,
    ): RevokeGatorPermissionArgs => {
      const { permissionResponse } = gatorPermission;
      const internalAccount = findDelegatorFromInternalAccounts(
        permissionResponse.address as `0x${string}`,
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
        accountAddress: internalAccount.address as `0x${string}`,
      };
    },
    [findDelegatorFromInternalAccounts],
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
        SignerParam,
        PermissionTypes
      >,
    ) => {
      const { networkClientId } = assertDefaultRpcEndpoint();
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
      return transactionMeta;
    },
    [
      assertDefaultRpcEndpoint,
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
        SignerParam,
        PermissionTypes
      >,
    ): Promise<TransactionMeta> => {
      assertEmptyGatorPermission(gatorPermission);
      assertChainId(gatorPermission);
      const transactionMeta = await addRevokeGatorPermissionTransaction(
        gatorPermission,
      );

      setTransactionId(transactionMeta?.id);

      return transactionMeta;
    },
    [
      addRevokeGatorPermissionTransaction,
      assertChainId,
      assertEmptyGatorPermission,
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
        SignerParam,
        PermissionTypes
      >[],
    ): Promise<TransactionMeta[]> => {
      assertEmptyGatorPermission(gatorPermissions);

      // TODO: We want to replace this with a batch 7702 transaction
      // so the user does not need to sequentially sign transactions
      const revokeTransactionMetas: TransactionMeta[] = [];
      for (const gatorPermission of gatorPermissions) {
        assertChainId(gatorPermission);
        const transactionMeta = await addRevokeGatorPermissionTransaction(
          gatorPermission,
        );
        revokeTransactionMetas.push(transactionMeta);
      }

      if (revokeTransactionMetas.length === 0) {
        throw new Error('No transactions to add to batch');
      }

      setTransactionId(revokeTransactionMetas[0].id);

      return revokeTransactionMetas;
    },
    [
      addRevokeGatorPermissionTransaction,
      assertChainId,
      assertEmptyGatorPermission,
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
    findDelegatorFromInternalAccounts,
  };
}
