import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { decodeDelegations } from '@metamask/delegation-core';
import { addTransaction } from '../../store/actions';
import { selectDefaultRpcEndpointByChainId } from '../../selectors';
import { useConfirmationNavigation } from '../../pages/confirmations/hooks/useConfirmationNavigation';
import {
  encodeDisableDelegation,
  Delegation,
} from '../../../shared/lib/delegation/delegation';

export function useRevokeGatorPermissions({
  accountAddress,
  chainId,
  onRedirect,
}: {
  accountAddress: Hex;
  chainId: Hex;
  onRedirect?: () => void;
}) {
  const [transactionId, setTransactionId] = useState<string | undefined>();
  const { confirmations, navigateToId } = useConfirmationNavigation();
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
    (delegation: Delegation) => {
      if (delegation.delegator.toLowerCase() !== accountAddress.toLowerCase()) {
        throw new Error(
          `Delegator address does not match. Expected: ${accountAddress}, Got: ${delegation.delegator}`,
        );
      }
    },
    [accountAddress],
  );

  const revokeGatorPermission = useCallback(
    async (
      permissionContext: Hex,
      delegationManagerAddress: Hex,
    ): Promise<TransactionMeta> => {
      const delegation =
        extractDelegationFromGatorPermissionContext(permissionContext);

      assertDelegatorAddress(delegation);

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
      accountAddress,
    ],
  );

  useEffect(() => {
    if (isRedirectPending) {
      navigateToId(transactionId);
      onRedirect?.();
    }
  }, [isRedirectPending, navigateToId, transactionId, onRedirect]);

  return { revokeGatorPermission };
}
