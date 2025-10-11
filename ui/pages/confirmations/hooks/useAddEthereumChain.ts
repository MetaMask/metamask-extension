import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { RpcEndpointType } from '@metamask/network-controller';
import { ApprovalType } from '@metamask/controller-utils';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { useConfirmContext } from '../context/confirm';
import {
  addNetwork,
  resolvePendingApproval,
  setNewNetworkAdded,
} from '../../../store/actions';
import type { MetaMaskReduxDispatch } from '../../../store/store';
import type { AddEthereumChainContext } from '../external/add-ethereum-chain/types';

// Ported from templates/add-ethereum-chain.js
export const useAddEthereumChain = () => {
  const dispatch = useDispatch<MetaMaskReduxDispatch>();
  const { currentConfirmation } = useConfirmContext<AddEthereumChainContext>();
  const { id, origin, requestData } = currentConfirmation ?? {};

  const onSubmit = useCallback(async () => {
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
  }, [id, origin, requestData, dispatch]);

  return {
    onSubmit,
  };
};

export function isAddEthereumChainType(
  confirmation: TransactionMeta | AddEthereumChainContext | null,
): confirmation is AddEthereumChainContext {
  return confirmation?.type === ApprovalType.AddEthereumChain;
}
