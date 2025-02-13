import { CHAIN_IDS } from '@metamask/transaction-controller';
import { NetworkConfiguration } from '@metamask/network-controller';
import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { NetworkListItem } from '../..';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../../shared/constants/network';
import { AvatarNetworkSize } from '../../../component-library';
import { showModal, setEditedNetwork } from '../../../../store/actions';

type NetworkItemsProps = {
  network: NetworkConfiguration;
  isUnlocked: boolean;
  currentChainId: string;
  handleNetworkChange: (network: NetworkConfiguration) => void;
  toggleNetworkMenu: () => void;
  setActionMode: React.Dispatch<React.SetStateAction<ACTION_MODES>>;
  focusSearch: boolean;
  showMultiRpcSelectors: boolean;
};

export enum ACTION_MODES {
  // Displays the search box and network list
  LIST,
  // Displays the form to add or edit a network
  ADD_EDIT,
  // Displays the page for adding an additional RPC URL
  ADD_RPC,
  // Displays the page for adding an additional explorer URL
  ADD_EXPLORER_URL,
  // Displays the page for selecting an RPC URL
  SELECT_RPC,
}

export const NetworkItems: React.FC<NetworkItemsProps> = ({
  network,
  isUnlocked,
  currentChainId,
  handleNetworkChange,
  toggleNetworkMenu,
  setActionMode,
  focusSearch,
  showMultiRpcSelectors,
}) => {
  const isCurrentNetwork = network.chainId === currentChainId;
  const canDeleteNetwork =
    isUnlocked && !isCurrentNetwork && network.chainId !== CHAIN_IDS.MAINNET;
  const dispatch = useDispatch();

  const onClickCallback = useCallback(() => {
    handleNetworkChange(network);
  }, [handleNetworkChange, network]);

  const onDeleteClickCallback = useCallback(() => {
    dispatch(toggleNetworkMenu());
    dispatch(
      showModal({
        name: 'CONFIRM_DELETE_NETWORK',
        target: network.chainId,
        onConfirm: () => undefined,
      }),
    );
  }, [dispatch, toggleNetworkMenu, showModal, network]);

  const onEditClickCallback = useCallback(() => {
    dispatch(
      setEditedNetwork({
        chainId: network.chainId,
        nickname: network.name,
      }),
    );
    setActionMode(ACTION_MODES.ADD_EDIT);
  }, [dispatch, network, setEditedNetwork, setActionMode, ACTION_MODES]);

  const onRpcEndpointClickCallback = useCallback(() => {
    setActionMode(ACTION_MODES.SELECT_RPC);
    dispatch(setEditedNetwork({ chainId: network.chainId }));
  }, [dispatch, network, setEditedNetwork, setActionMode, ACTION_MODES]);

  return (
    <NetworkListItem
      name={network.name}
      key={network.chainId}
      iconSrc={
        CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
          network.chainId as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
        ]
      }
      iconSize={AvatarNetworkSize.Sm}
      rpcEndpoint={
        showMultiRpcSelectors
          ? network.rpcEndpoints[network.defaultRpcEndpointIndex]
          : undefined
      }
      chainId={network.chainId}
      selected={isCurrentNetwork && !focusSearch}
      focus={isCurrentNetwork && !focusSearch}
      onClick={onClickCallback}
      onDeleteClick={canDeleteNetwork ? onDeleteClickCallback : undefined}
      onEditClick={onEditClickCallback}
      onRpcEndpointClick={onRpcEndpointClickCallback}
    />
  );
};
