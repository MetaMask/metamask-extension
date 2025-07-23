import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { decodeDelegations } from '@metamask/delegation-core';
import { addTransactionAndRouteToConfirmationPage } from '../../store/actions';
import {
  getSelectedInternalAccount,
  selectDefaultRpcEndpointByChainId,
} from '../../selectors';
import { useConfirmationNavigation } from '../../pages/confirmations/hooks/useConfirmationNavigation';
import { encodeDisableDelegation } from '../../../shared/lib/delegation/delegation';

export function useRevokeGatorPermissions({
  chainId,
  onRedirect,
}: {
  chainId: Hex;
  onRedirect?: () => void;
}) {
  const dispatch = useDispatch();
  const [transactionId, setTransactionId] = useState<string | undefined>();
  const { confirmations, navigateToId } = useConfirmationNavigation();

  const selectedAccount = useSelector(
    getSelectedInternalAccount,
  ) as InternalAccount;
  const defaultRpcEndpoint = useSelector((state) =>
    selectDefaultRpcEndpointByChainId(state, chainId),
  ) ?? { defaultRpcEndpoint: {} };
  const { networkClientId } = defaultRpcEndpoint as { networkClientId: string };

  const isRedirectPending = confirmations.some(
    (conf) => conf.id === transactionId,
  );

  useEffect(() => {
    if (isRedirectPending) {
      navigateToId(transactionId);
      onRedirect?.();
    }
  }, [isRedirectPending, navigateToId, transactionId, onRedirect]);

  const revokeGatorPermission = useCallback(
    async (
      permissionContext: Hex,
      delegationManagerAddress: Hex,
    ): Promise<TransactionMeta> => {
      // Gator 7715 permissions only have a single signed delegation:
      // https://github.com/MetaMask/snap-7715-permissions/blob/main/packages/gator-permissions-snap/src/core/permissionRequestLifecycleOrchestrator.ts#L259
      const delegations = decodeDelegations(permissionContext);
      const firstDelegation = delegations[0];
      if (!firstDelegation) {
        throw new Error('No delegation found');
      }

      const encodedCallData = encodeDisableDelegation({
        delegation: {
          ...firstDelegation,
          salt: firstDelegation.salt.toString() as `0x${string}`,
        },
      });

      // This transaction will revert if the `msg.sender` is not the 'delegator' in the delegation that is being revoked
      const transactionMeta = (await dispatch(
        addTransactionAndRouteToConfirmationPage(
          {
            from: selectedAccount.address, // TODO: We need to use the internal account address here that is the delegator address of the delegation that is being revoked
            to: delegationManagerAddress,
            data: encodedCallData,
            value: '0x0',
          },
          {
            networkClientId,
            type: TransactionType.contractInteraction,
          },
        ),
      )) as unknown as TransactionMeta;
      setTransactionId(transactionMeta?.id);

      return transactionMeta;
    },
    [dispatch, networkClientId, selectedAccount],
  );

  return { revokeGatorPermission };
}
