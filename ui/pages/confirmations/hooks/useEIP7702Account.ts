import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { TransactionMeta } from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import {
  createEIP7702UpgradeTransaction,
  createEIP7702DowngradeTransaction,
  isAccountUpgraded,
  EIP_7702_REVOKE_ADDRESS,
} from '../../../../shared/lib/eip7702-utils';
import {
  addTransactionAndRouteToConfirmationPage,
  getCode,
} from '../../../store/actions';
import { selectDefaultRpcEndpointByChainId } from '../../../selectors';
import { useConfirmationNavigation } from './useConfirmationNavigation';

export function useEIP7702Account(
  { chainId, onRedirect }: { chainId: Hex; onRedirect?: () => void } = {
    chainId: '0x',
  },
) {
  const dispatch = useDispatch();
  const [transactionId, setTransactionId] = useState<string | undefined>();
  const { confirmations, navigateToId } = useConfirmationNavigation();
  const defaultRpcEndpoint = useSelector((state) =>
    selectDefaultRpcEndpointByChainId(state, chainId),
  ) ?? { defaultRpcEndpoint: {} };
  const { networkClientId } = defaultRpcEndpoint as { networkClientId: string };

  const isRedirectPending = confirmations.some(
    (conf) => conf.id === transactionId,
  );

  const downgradeAccount = useCallback(
    async (address: Hex) => {
      const result = await createEIP7702DowngradeTransaction(
        {
          address,
          networkClientId,
        },
        async (transactionParams, options) => {
          const transactionMeta = (await dispatch(
            addTransactionAndRouteToConfirmationPage(
              transactionParams,
              options,
            ),
          )) as unknown as TransactionMeta;
          return transactionMeta;
        },
      );

      setTransactionId(result.transactionId);
    },
    [dispatch, networkClientId],
  );

  const upgradeAccount = useCallback(
    async (address: Hex, upgradeContractAddress: Hex) => {
      const result = await createEIP7702UpgradeTransaction(
        {
          address,
          upgradeContractAddress,
          networkClientId,
        },
        async (transactionParams, options) => {
          const transactionMeta = (await dispatch(
            addTransactionAndRouteToConfirmationPage(
              transactionParams,
              options,
            ),
          )) as unknown as TransactionMeta;
          return transactionMeta;
        },
      );

      setTransactionId(result.transactionId);
    },
    [dispatch, networkClientId],
  );

  const isUpgraded = useCallback(
    async (address: Hex) => {
      return isAccountUpgraded(address, networkClientId, getCode);
    },
    [networkClientId],
  );

  useEffect(() => {
    if (isRedirectPending) {
      navigateToId(transactionId);
      onRedirect?.();
    }
  }, [isRedirectPending, navigateToId, transactionId, onRedirect]);

  return { isUpgraded, downgradeAccount, upgradeAccount };
}

export { EIP_7702_REVOKE_ADDRESS };
