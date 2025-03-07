import { NetworkConfiguration } from '@metamask/network-controller';
import { type MultichainNetworkConfiguration } from '@metamask/multichain-network-controller';
import { CaipChainId, EthScope } from '@metamask/keyring-api';
import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { NetworkListItem } from '../../network-list-item';
import { AvatarNetworkSize } from '../../../component-library';
import {
  getNetworkIcon,
  getRpcDataByChainId,
  convertCaipToHexChainId,
} from '../../../../../shared/modules/network.utils';
import { showModal, setEditedNetwork } from '../../../../store/actions';
import { useAccountCreationOnNetworkChange } from '../../../../hooks/accounts/useAccountCreationOnNetworkChange';

export enum ACTION_MODE {
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
  // Add account for non EVM networks
  ADD_NON_EVM_ACCOUNT,
}

type NetworkItemsProps = {
  network: MultichainNetworkConfiguration;
  isUnlocked: boolean;
  currentChainId: string;
  handleNetworkChange: (chainId: CaipChainId) => void;
  toggleNetworkMenu: () => void;
  setActionMode: React.Dispatch<React.SetStateAction<ACTION_MODE>>;
  focusSearch: boolean;
  evmNetworks: Record<`0x${string}`, NetworkConfiguration>;
};

export const NetworkItems: React.FC<NetworkItemsProps> = ({
  network,
  isUnlocked,
  currentChainId,
  handleNetworkChange,
  toggleNetworkMenu,
  setActionMode,
  focusSearch,
  evmNetworks,
}) => {
  const isCurrentNetwork = network.chainId === currentChainId;

  const iconSrc = getNetworkIcon(network);

  const dispatch = useDispatch();
  const { hasAnyAccountsInNetwork } = useAccountCreationOnNetworkChange();

  const hasMultiRpcOptions = useCallback(
    (networkConfig: MultichainNetworkConfiguration): boolean =>
      networkConfig.isEvm &&
      getRpcDataByChainId(networkConfig.chainId, evmNetworks).rpcEndpoints
        .length > 1,
    [evmNetworks],
  );

  const getItemCallbacks = useCallback(
    (
      networkConfig: MultichainNetworkConfiguration,
    ): Record<string, (() => void) | undefined> => {
      const { chainId, isEvm } = network;

      if (!isEvm) {
        return {};
      }

      // Non-EVM networks cannot be deleted, edited or have
      // RPC endpoints so it's safe to call this conversion function here.
      const hexChainId = convertCaipToHexChainId(chainId);
      const isDeletable =
        isUnlocked &&
        networkConfig.chainId !== currentChainId &&
        networkConfig.chainId !== EthScope.Mainnet;

      return {
        onDelete: isDeletable
          ? () => {
              dispatch(toggleNetworkMenu());
              dispatch(
                showModal({
                  name: 'CONFIRM_DELETE_NETWORK',
                  target: hexChainId,
                  onConfirm: () => undefined,
                }),
              );
            }
          : undefined,
        onEdit: () => {
          dispatch(
            setEditedNetwork({
              chainId: hexChainId,
              nickname: networkConfig.name,
            }),
          );
          setActionMode(ACTION_MODE.ADD_EDIT);
        },
        onRpcConfigEdit: hasMultiRpcOptions(networkConfig)
          ? () => {
              setActionMode(ACTION_MODE.SELECT_RPC);
              dispatch(
                setEditedNetwork({
                  chainId: hexChainId,
                }),
              );
            }
          : undefined,
      };
    },
    [currentChainId, dispatch, hasMultiRpcOptions, isUnlocked],
  );

  const { onDelete, onEdit, onRpcConfigEdit } = getItemCallbacks(network);

  const isNetworkEnabled = useCallback(
    (networkConfig: MultichainNetworkConfiguration): boolean =>
      networkConfig.isEvm ||
      isUnlocked ||
      hasAnyAccountsInNetwork(networkConfig.chainId),
    [hasAnyAccountsInNetwork, isUnlocked],
  );

  return (
    <NetworkListItem
      key={network.chainId}
      chainId={network.chainId}
      name={network.name}
      iconSrc={iconSrc}
      iconSize={AvatarNetworkSize.Sm}
      selected={isCurrentNetwork && !focusSearch}
      focus={isCurrentNetwork && !focusSearch}
      rpcEndpoint={
        hasMultiRpcOptions(network)
          ? getRpcDataByChainId(network.chainId, evmNetworks).defaultRpcEndpoint
          : undefined
      }
      onClick={async () => {
        await handleNetworkChange(network.chainId);
      }}
      onDeleteClick={onDelete}
      onEditClick={onEdit}
      onRpcEndpointClick={onRpcConfigEdit}
      disabled={!isNetworkEnabled(network)}
    />
  );
};
