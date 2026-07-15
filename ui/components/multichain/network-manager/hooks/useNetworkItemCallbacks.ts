import { useCallback } from 'react';
import { EthScope } from '@metamask/keyring-api';
import { type MultichainNetworkConfiguration } from '@metamask/multichain-network-controller';
import { type CaipChainId, type Hex } from '@metamask/utils';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import {
  CHAIN_IDS,
  CHAIN_ID_PORTFOLIO_LANDING_PAGE_URL_MAP,
} from '../../../../../shared/constants/network';
import {
  convertCaipToHexChainId,
  getRpcDataByChainId,
} from '../../../../../shared/lib/network.utils';
import { openWindow } from '../../../../helpers/utils/window';
import { isDisableableDefaultNetwork } from '../../../../helpers/utils/network-sections';
import {
  removeNetwork,
  setEditedNetwork,
  showModal,
} from '../../../../store/actions';
import {
  getMultichainNetworkConfigurationsByChainId,
  getNetworkDiscoverButtonEnabled,
  getSelectedMultichainNetworkChainId,
} from '../../../../selectors';
import { getCompletedOnboarding } from '../../../../ducks/metamask/metamask';
import { getIsUnlocked } from '../../../../ducks/metamask/base-selectors';
import { useAccountNetworkAvailability } from '../../../../hooks/accounts/useAccountNetworkAvailability';
import { useAppDispatch } from '../../../../store/hooks';

export type NetworkItemCallbacks = {
  onDelete?: () => void;
  onDeleteMenuLabel?: 'disable' | 'delete';
  onEdit?: () => void;
  onDiscoverClick?: () => void;
  onRpcConfigEdit?: () => void;
  onRpcSelect?: () => void;
};

export const useNetworkItemCallbacks = () => {
  const dispatch = useAppDispatch();
  const [, setSearchParams] = useSearchParams();
  const isUnlocked = useSelector(getIsUnlocked);
  const currentChainId = useSelector(getSelectedMultichainNetworkChainId);
  const isNetworkDiscoverButtonEnabled = useSelector(
    getNetworkDiscoverButtonEnabled,
  );
  const [, evmNetworks] = useSelector(
    getMultichainNetworkConfigurationsByChainId,
  );
  const completedOnboarding = useSelector(getCompletedOnboarding);

  const { hasAnyAccountsInNetwork } = useAccountNetworkAvailability();

  const isDiscoverBtnEnabled = useCallback(
    (chainId: Hex | `${string}:${string}`): boolean => {
      // The "Discover" button should be enabled when the mapping for the chainId is enabled in the feature flag json
      // and in the constants `CHAIN_ID_PORTFOLIO_LANDING_PAGE_URL_MAP`.
      return Boolean(
        isNetworkDiscoverButtonEnabled?.[
          chainId as keyof typeof isNetworkDiscoverButtonEnabled
        ] && CHAIN_ID_PORTFOLIO_LANDING_PAGE_URL_MAP[chainId] !== undefined,
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
    (network: MultichainNetworkConfiguration): NetworkItemCallbacks => {
      const { chainId, isEvm } = network;
      const hexChainId = isEvm ? convertCaipToHexChainId(chainId) : undefined;
      const isDisableableDefault = isDisableableDefaultNetwork(chainId);
      const isEthereumMainnet =
        chainId === EthScope.Mainnet ||
        (isEvm && hexChainId === CHAIN_IDS.MAINNET);
      const isSelectedNetwork =
        chainId === currentChainId ||
        (Boolean(hexChainId) && hexChainId === currentChainId);

      const canRemoveOrDisable =
        isUnlocked &&
        !isSelectedNetwork &&
        (isDisableableDefault
          ? !isEthereumMainnet
          : isEvm &&
            chainId !== currentChainId &&
            chainId !== EthScope.Mainnet);

      let onDeleteMenuLabel: 'disable' | 'delete' | undefined;
      if (canRemoveOrDisable) {
        onDeleteMenuLabel = isDisableableDefault ? 'disable' : 'delete';
      }

      const modalProps = {
        onConfirm: () => undefined,
        onHide: () => undefined,
      };

      const discoverChainId = isEvm ? hexChainId : chainId;
      const onDiscoverClick = isDiscoverBtnEnabled(
        discoverChainId as Hex | `${string}:${string}`,
      )
        ? () => {
            openWindow(
              CHAIN_ID_PORTFOLIO_LANDING_PAGE_URL_MAP[
                discoverChainId as keyof typeof CHAIN_ID_PORTFOLIO_LANDING_PAGE_URL_MAP
              ],
              '_blank',
            );
          }
        : undefined;

      const onDelete = canRemoveOrDisable
        ? () => {
            if (isDisableableDefault) {
              dispatch(removeNetwork(chainId as CaipChainId));
              return;
            }
            dispatch(
              showModal({
                name: 'CONFIRM_DELETE_NETWORK',
                target: hexChainId,
                ...modalProps,
              }),
            );
          }
        : undefined;

      if (!isEvm) {
        return {
          onDelete,
          onDeleteMenuLabel,
          onDiscoverClick,
        };
      }

      const evmHexChainId = convertCaipToHexChainId(chainId);

      return {
        onDelete,
        onDeleteMenuLabel,
        onEdit: () => {
          dispatch(
            setEditedNetwork({
              chainId: evmHexChainId,
              nickname: network.name,
            }),
          );
          setSearchParams({ view: 'edit' });
        },
        onDiscoverClick,
        onRpcConfigEdit: hasMultiRpcOptions(network)
          ? () => {
              setSearchParams({ view: 'add-rpc' });
              dispatch(
                setEditedNetwork({
                  chainId: evmHexChainId,
                }),
              );
            }
          : undefined,
        onRpcSelect: () => {
          dispatch(
            setEditedNetwork({
              chainId: evmHexChainId,
            }),
          );
          setSearchParams({ view: 'select-rpc' });
        },
      };
    },
    [
      currentChainId,
      dispatch,
      hasMultiRpcOptions,
      isUnlocked,
      isDiscoverBtnEnabled,
      setSearchParams,
    ],
  );

  return {
    getItemCallbacks,
    hasMultiRpcOptions,
    isNetworkEnabled,
  };
};
