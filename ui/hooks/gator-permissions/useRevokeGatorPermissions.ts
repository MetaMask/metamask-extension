import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { decodeDelegations } from '@metamask/delegation-core';
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
  ) ?? { defaultRpcEndpoint: {} };
  const { networkClientId } = defaultRpcEndpoint as { networkClientId: string };

  const isRedirectPending = useMemo(() => {
    return confirmations.some((conf) => conf.id === transactionId);
  }, [confirmations, transactionId]);

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
        salt: firstDelegation.salt.toString() as `0x${string}`,
      };
    },
    [],
  );

  const assertDelegatorAddress = useCallback(
    (delegation: Delegation, accountAddress: Hex) => {
      if (!isEqualCaseInsensitive(delegation.delegator, accountAddress)) {
        throw new Error(
          `Delegator address does not match. Expected: ${accountAddress}, Got: ${delegation.delegator}`,
        );
      }
    },
    [],
  );

  const findDelegatorFromInternalAccounts = useCallback(
    (delegator: Hex) => {
      return internalAccounts.find((account) =>
        isEqualCaseInsensitive(account.address, delegator),
      );
    },
    [internalAccounts],
  );

  const revokeGatorPermission = useCallback(
    async ({
      permissionContext,
      delegationManagerAddress,
      accountAddress,
    }: {
      permissionContext: Hex;
      delegationManagerAddress: Hex;
      accountAddress: Hex;
    }): Promise<TransactionMeta> => {
      console.log('revokeGatorPermission', {
        permissionContext,
        delegationManagerAddress,
        accountAddress,
      });
      const delegation =
        extractDelegationFromGatorPermissionContext(permissionContext);

      assertDelegatorAddress(delegation, accountAddress);

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
      setTransactionId(transactionMeta?.id);

      return transactionMeta;
    },
    [
      extractDelegationFromGatorPermissionContext,
      assertDelegatorAddress,
      networkClientId,
    ],
  );

  const revokeGatorPermissionBatch = useCallback(
    async (
      revokeGatorPermissionArgs: RevokeGatorPermissionArgs[],
    ): Promise<TransactionMeta[]> => {
      console.log('revokeGatorPermissionBatch', revokeGatorPermissionArgs);
      if (revokeGatorPermissionArgs.length === 0) {
        throw new Error('No permission contexts provided');
      }

      // Process each revoke gator permission as sequential transactions
      // TODO: We want to replace this with a batch 7702 transaction
      // so user does not need to be sequential sign transactions
      const revokeTransactionMetas: TransactionMeta[] = [];
      for (const revokeGatorPermissionArg of revokeGatorPermissionArgs) {
        const { permissionContext, delegationManagerAddress, accountAddress } =
          revokeGatorPermissionArg;
        const delegation =
          extractDelegationFromGatorPermissionContext(permissionContext);

        const encodedCallData = encodeDisableDelegation({
          delegation,
        });

        assertDelegatorAddress(delegation, accountAddress);
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
        revokeTransactionMetas.push(transactionMeta);
      }

      if (revokeTransactionMetas.length === 0) {
        throw new Error('No transactions to add to batch');
      }

      // we want to redirect to the first transaction meta
      setTransactionId(revokeTransactionMetas[0].id);

      return revokeTransactionMetas;
    },
    [
      assertDelegatorAddress,
      extractDelegationFromGatorPermissionContext,
      networkClientId,
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
