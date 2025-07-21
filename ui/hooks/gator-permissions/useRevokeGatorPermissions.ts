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
      try {
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

        // Issue here, this transaction will revert: The `disableDelegation()` function has a modifier(onlyDeleGator) that checks if the `msg.sender` is the 'delegator' in the delegation that is being revoked
        // We need to use the delegator address to send the transaction which is not an internal account in MM but instead a account in the snap created via snap entropy
        // See the modifier definition in the delegation-framework: https://github.com/MetaMask/delegation-framework/blob/main/src/DelegationManager.sol#L90
        // See sample transaction that resulted in a revert(sepolia): https://sepolia.etherscan.io/tx/0x449f6a62f6232d88e53cdc06cf6ba1785cfb4dc1fa41a9e39fd09caf772ac3de
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
      } catch (error) {
        console.error('Failed to create transaction:', error);
        throw error;
      }
    },
    [dispatch, networkClientId, selectedAccount],
  );

  return { revokeGatorPermission };
}
