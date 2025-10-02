import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { RpcEndpointType } from '@metamask/network-controller';
import { ApprovalType } from '@metamask/controller-utils';
import type {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { useConfirmContext } from '../context/confirm';
import {
  addNetwork,
  resolvePendingApproval,
  setNewNetworkAdded,
} from '../../../store/actions';
import type { MetaMaskReduxDispatch } from '../../../store/store';
import type { AddEthereumChainContext } from '../external/add-ethereum-chain/types';
import { jsonRpcRequest } from '../../../../shared/modules/rpc.utils';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { Severity } from '../../../helpers/constants/design-system';
import { updateAlerts } from '../../../ducks/confirm-alerts/confirm-alerts';

// Ported from templates/add-ethereum-chain.js
export const useAddEthereumChain = () => {
  const t = useI18nContext();
  const dispatch = useDispatch<MetaMaskReduxDispatch>();
  const { currentConfirmation } = useConfirmContext<AddEthereumChainContext>();
  const { id, origin, requestData } = currentConfirmation ?? {};

  const onSubmit = useCallback(async () => {
    const customRpcUrl = requestData?.rpcUrl;

    let endpointChainId;

    try {
      endpointChainId = (await jsonRpcRequest(
        customRpcUrl,
        'eth_chainId',
      )) as string;
    } catch (err) {
      console.error(
        `Request for method 'eth_chainId on ${customRpcUrl} failed`,
      );

      const alert = {
        key: 'errorWhileConnectingToRPC',
        message: t('errorWhileConnectingToRPC'),
        severity: Severity.Warning,
        field: 'rpcUrl',
        isBlocking: true,
      };

      dispatch(updateAlerts(id as string, [alert]));
    }

    if (requestData?.chainId !== endpointChainId) {
      console.error(
        `Chain ID returned by RPC URL ${customRpcUrl} does not match ${endpointChainId}`,
      );

      const alert = {
        key: 'mismatchedRpcChainId',
        message: t('mismatchedRpcChainId'),
        severity: Severity.Warning,
        field: 'network',
        isBlocking: true,
      };

      dispatch(updateAlerts(id as string, [alert]));
    }

    await dispatch(resolvePendingApproval(id, requestData));

    const originIsMetaMask = origin === 'metamask';

    if (originIsMetaMask) {
      const blockExplorer = requestData.rpcPrefs.blockExplorerUrl;

      const addedNetwork = await dispatch(
        addNetwork({
          chainId: requestData.chainId,
          name: requestData.chainName,
          nativeCurrency: requestData.ticker,
          blockExplorerUrls: blockExplorer ? [blockExplorer] : [],
          defaultBlockExplorerUrlIndex: blockExplorer ? 0 : undefined,
          defaultRpcEndpointIndex: 0,
          rpcEndpoints: [
            {
              url: requestData.rpcUrl,
              failoverUrls: requestData.failoverRpcUrls,
              type: RpcEndpointType.Custom,
            },
          ],
        }),
      );

      await dispatch(
        setNewNetworkAdded({
          networkConfigurationId: addedNetwork.rpcEndpoints[0].networkClientId,
          nickname: requestData.chainName,
        }),
      );
    }
  }, [id, origin, requestData, dispatch, t]);

  return {
    onSubmit,
  };
};

export function isAddEthereumChainType(confirmation: TransactionMeta | null) {
  return (
    confirmation?.type ===
    (ApprovalType.AddEthereumChain as unknown as TransactionType)
  );
}
