import { useCallback } from 'react';
import { EthScope } from '@metamask/keyring-api';
import { type MultichainNetworkConfiguration } from '@metamask/multichain-network-controller';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { CHAIN_ID_PROFOLIO_LANDING_PAGE_URL_MAP } from '../../../../../shared/constants/network';
import {
  convertCaipToHexChainId,
  getRpcDataByChainId,
} from '../../../../../shared/modules/network.utils';
import { isDiscoverButtonEnabled } from '../../../../../shared/modules/network-discover-utils';
import { openWindow } from '../../../../helpers/utils/window';
import { setEditedNetwork, showModal } from '../../../../store/actions';
import {
  getMultichainNetworkConfigurationsByChainId,
  getNetworkDiscoverButtonEnabled,
  getSelectedMultichainNetworkChainId,
} from '../../../../selectors';
import {
  getCompletedOnboarding,
  getIsUnlocked,
} from '../../../../ducks/metamask/metamask';
import { useAccountCreationOnNetworkChange } from '../../../../hooks/accounts/useAccountCreationOnNetworkChange';

export const useNetworkItemCallbacks = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const isUnlocked = useSelector(getIsUnlocked);
  const currentChainId = useSelector(getSelectedMultichainNetworkChainId);
  const isNetworkDiscoverButtonEnabled = useSelector(
    getNetworkDiscoverButtonEnabled,
  );
  const [, evmNetworks] = useSelector(
    getMultichainNetworkConfigurationsByChainId,
  );
  const completedOnboarding = useSelector(getCompletedOnboarding);

  const { hasAnyAccountsInNetwork } = useAccountCreationOnNetworkChange();

  const isDiscoverBtnEnabled = useCallback(
    (network: MultichainNetworkConfiguration): boolean => {
      return isDiscoverButtonEnabled(
        network,
        isNetworkDiscoverButtonEnabled as Record<string, boolean>,
      );
    },
    [isNetworkDiscoverButtonEnabled],
  );

  const hasMultiRpcOptions = useCallback(
    (network: MultichainNetworkConfiguration): boolean =>
      network.isEvm &&
      getRpcDataByChainId(network.chainId, evmNetworks).rpcEndpoints.length > 1,
    [evmNetworks],
  );

  const isNetworkEnabled = useCallback(
    (network: MultichainNetworkConfiguration): boolean => {
      return (
        network.isEvm ||
        completedOnboarding ||
        hasAnyAccountsInNetwork(network.chainId)
      );
    },
    [hasAnyAccountsInNetwork, completedOnboarding],
  );

  const getItemCallbacks = useCallback(
    (
      network: MultichainNetworkConfiguration,
    ): Record<string, (() => void) | undefined> => {
      const { chainId, isEvm } = network;

      if (!isEvm) {
        // For non-EVM networks, only provide discover functionality if available
        return {
          onDiscoverClick: isDiscoverBtnEnabled(network)
            ? () => {
                openWindow(
                  CHAIN_ID_PROFOLIO_LANDING_PAGE_URL_MAP[chainId],
                  '_blank',
                );
              }
            : undefined,
        };
      }
      const hexChainId = convertCaipToHexChainId(chainId);
      const isDeletable =
        isUnlocked &&
        network.chainId !== currentChainId &&
        network.chainId !== EthScope.Mainnet;

      const modalProps = {
        onConfirm: () => undefined,
        onHide: () => undefined,
      };

      return {
        onDelete: isDeletable
          ? () => {
              dispatch(
                showModal({
                  name: 'CONFIRM_DELETE_NETWORK',
                  target: hexChainId,
                  ...modalProps,
                }),
              );
            }
          : undefined,
        onEdit: () => {
          dispatch(
            setEditedNetwork({
              chainId: hexChainId,
              nickname: network.name,
            }),
          );
          history.push('/edit');
        },
        onDiscoverClick: isDiscoverBtnEnabled(network)
          ? () => {
              openWindow(
                CHAIN_ID_PROFOLIO_LANDING_PAGE_URL_MAP[hexChainId],
                '_blank',
              );
            }
          : undefined,
        onRpcConfigEdit: hasMultiRpcOptions(network)
          ? () => {
              history.push('/add-rpc');
              dispatch(
                setEditedNetwork({
                  chainId: hexChainId,
                }),
              );
            }
          : undefined,
        onRpcSelect: () => {
          history.push('/select-rpc', {
            chainId: hexChainId,
          });
        },
      };
    },
    [
      currentChainId,
      dispatch,
      hasMultiRpcOptions,
      isUnlocked,
      isDiscoverBtnEnabled,
      history,
    ],
  );

  return {
    getItemCallbacks,
    hasMultiRpcOptions,
    isNetworkEnabled,
  };
};
