import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import {
  TransactionMeta,
  TransactionType,
  TransactionEnvelopeType
} from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { addTransactionAndRouteToConfirmationPage } from '../../store/actions';
import {
  getSelectedInternalAccount,
  selectDefaultRpcEndpointByChainId,
} from '../../selectors';
import { useConfirmationNavigation } from '../../pages/confirmations/hooks/useConfirmationNavigation';

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

  const selectedAccount = useSelector(getSelectedInternalAccount);
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

  // TODO: We should make the the selectedAccount the 'delegator' address of the gator permission
  // TODO: Make gatorPermission a generic type so this single function can handle all supported gator permissions types
  const revokeGatorPermission = useCallback(
    async (gatorPermission: unknown): Promise<TransactionMeta> => {
      try {
        console.log('revokeGatorPermission:', selectedAccount, gatorPermission);
        // TODO: Implement the revoke logic here to revoke the gator permission
        const transactionMeta = (await dispatch(
          addTransactionAndRouteToConfirmationPage(
            {
              from: selectedAccount.address,
              to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
              value: '0x38D7EA4C68000',
              data: '0x',
              type: TransactionEnvelopeType.simpleSend,
            },
            {
              networkClientId,
              type: TransactionType.simpleSend,
            },
          ),
        )) as unknown as TransactionMeta;
        console.log('revokeGatorPermission transactionMeta:', transactionMeta);
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
