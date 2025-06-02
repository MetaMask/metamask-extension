import { EthScope } from '@metamask/keyring-api';
import {
  NON_EVM_TESTNET_IDS,
  type MultichainNetworkConfiguration,
} from '@metamask/multichain-network-controller';
import {
  type CaipChainId,
  type Hex
} from '@metamask/utils';
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName
} from '../../../../../../shared/constants/metametrics';
import {
  CHAIN_ID_PROFOLIO_LANDING_PAGE_URL_MAP,
  TEST_CHAINS
} from '../../../../../../shared/constants/network';
import {
  convertCaipToHexChainId,
  getRpcDataByChainId,
  sortNetworks
} from '../../../../../../shared/modules/network.utils';
import { MetaMetricsContext } from '../../../../../contexts/metametrics';
import {
  getCompletedOnboarding,
  getIsUnlocked,
} from '../../../../../ducks/metamask/metamask';
import {
  Display,
  FlexDirection
} from '../../../../../helpers/constants/design-system';
import { openWindow } from '../../../../../helpers/utils/window';
import { useAccountCreationOnNetworkChange } from '../../../../../hooks/accounts/useAccountCreationOnNetworkChange';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  getAllChainsToPoll,
  getAllDomains,
  getIsAccessedFromDappConnectedSitePopover,
  getMultichainNetworkConfigurationsByChainId,
  getNetworkDiscoverButtonEnabled,
  getOrderedNetworksList,
  getOriginOfCurrentTab,
  getPermittedEVMAccountsForSelectedTab,
  getPermittedEVMChainsForSelectedTab,
  getPreferences,
  getSelectedMultichainNetworkChainId
} from '../../../../../selectors';
import {
  addPermittedChain,
  detectNfts,
  setActiveNetwork,
  setEditedNetwork,
  setNetworkClientIdForDomain,
  setNextNonce,
  setTokenNetworkFilter,
  showModal,
  showPermittedNetworkToast,
  toggleNetworkMenu,
  updateCustomNonce
} from '../../../../../store/actions';
import {
  AvatarNetworkSize,
  Box
} from '../../../../component-library';
import { NetworkListItem } from '../../../network-list-item';

export const TestNetworks = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);
  const { hasAnyAccountsInNetwork } = useAccountCreationOnNetworkChange();

  const { tokenNetworkFilter } = useSelector(getPreferences);
  const selectedTabOrigin = useSelector(getOriginOfCurrentTab);
  const isUnlocked = useSelector(getIsUnlocked);
  const domains = useSelector(getAllDomains);
  const orderedNetworksList = useSelector(getOrderedNetworksList);
  const completedOnboarding = useSelector(getCompletedOnboarding);
  const isNetworkDiscoverButtonEnabled = useSelector(
    getNetworkDiscoverButtonEnabled,
  );

  const [multichainNetworks, evmNetworks] = useSelector(
    getMultichainNetworkConfigurationsByChainId,
  );
  const currentChainId = useSelector(getSelectedMultichainNetworkChainId);
  const permittedChainIds = useSelector((state) =>
    getPermittedEVMChainsForSelectedTab(state, selectedTabOrigin),
  );

  const permittedAccountAddresses = useSelector((state) =>
    getPermittedEVMAccountsForSelectedTab(state, selectedTabOrigin),
  );

  const allChainIds = useSelector(getAllChainsToPoll);

  // Extract test networks from multichain networks
  const [nonTestNetworks, testNetworks] = useMemo(
    () =>
      Object.entries(multichainNetworks).reduce(
        ([nonTestnetsList, testnetsList], [id, network]) => {
          let chainId = id;
          let isTest = false;

          if (network.isEvm) {
            // We keep using raw chain ID for EVM.
            chainId = convertCaipToHexChainId(network.chainId);
            isTest = TEST_CHAINS.includes(chainId as Hex);
          } else {
            isTest = NON_EVM_TESTNET_IDS.includes(network.chainId);
          }
          (isTest ? testnetsList : nonTestnetsList)[chainId] = network;
          return [nonTestnetsList, testnetsList];
        },
        [
          {} as Record<string, MultichainNetworkConfiguration>,
          {} as Record<string, MultichainNetworkConfiguration>,
        ],
      ),
    [multichainNetworks],
  );

  // Sort test networks
  const [orderedTestNetworks, setOrderedTestNetworks] = useState(
    sortNetworks(testNetworks, orderedNetworksList),
  );

  useEffect(
    () =>
      setOrderedTestNetworks(sortNetworks(testNetworks, orderedNetworksList)),
    [testNetworks, orderedNetworksList],
  );

  const [selectedNonEvmNetwork, setSelectedNonEvmNetwork] =
    useState<CaipChainId>();

  const handleEvmNetworkChange = (
    chainId: CaipChainId,
    networkClientId?: string,
  ) => {
    const hexChainId = convertCaipToHexChainId(chainId);
    const { defaultRpcEndpoint } = getRpcDataByChainId(chainId, evmNetworks);
    const finalNetworkClientId =
      networkClientId ?? defaultRpcEndpoint.networkClientId;

    dispatch(setActiveNetwork(finalNetworkClientId));
    dispatch(updateCustomNonce(''));
    dispatch(setNextNonce(''));
    dispatch(detectNfts(allChainIds));

    if (Object.keys(tokenNetworkFilter || {}).length <= 1) {
      dispatch(setTokenNetworkFilter({ [hexChainId]: true }));
    } else {
      const allOpts = Object.keys(evmNetworks).reduce((acc, id) => {
        acc[id] = true;
        return acc;
      }, {} as Record<string, boolean>);
      dispatch(setTokenNetworkFilter(allOpts));
    }

    if (selectedTabOrigin && domains[selectedTabOrigin]) {
      setNetworkClientIdForDomain(selectedTabOrigin, finalNetworkClientId);
    }

    if (permittedAccountAddresses.length > 0) {
      dispatch(addPermittedChain(selectedTabOrigin, chainId));
      if (!permittedChainIds.includes(hexChainId)) {
        dispatch(showPermittedNetworkToast());
      }
    }
  };

  const handleNonEvmNetworkChange = async (chainId: CaipChainId) => {
    if (hasAnyAccountsInNetwork(chainId)) {
      dispatch(toggleNetworkMenu());
      dispatch(setActiveNetwork(chainId));
      return;
    }
    // For test networks component, we might need to handle non-EVM account creation differently
    setSelectedNonEvmNetwork(chainId);
  };

  const getMultichainNetworkConfigurationOrThrow = (chainId: CaipChainId) => {
    const network = multichainNetworks[chainId];
    if (!network) {
      throw new Error(
        `Network configuration not found for chainId: ${chainId}`,
      );
    }
    return network;
  };

  const handleNetworkChange = async (chainId: CaipChainId) => {
    const currentChain =
      getMultichainNetworkConfigurationOrThrow(currentChainId);
    const chain = getMultichainNetworkConfigurationOrThrow(chainId);

    if (chain.isEvm) {
      handleEvmNetworkChange(chainId);
    } else {
      await handleNonEvmNetworkChange(chainId);
    }

    const chainIdToTrack = chain.isEvm
      ? convertCaipToHexChainId(chainId)
      : chainId;
    const currentChainIdToTrack = currentChain.isEvm
      ? convertCaipToHexChainId(currentChainId)
      : currentChainId;

    trackEvent({
      event: MetaMetricsEventName.NavNetworkSwitched,
      category: MetaMetricsEventCategory.Network,
      properties: {
        location: 'Network Menu',
        chain_id: currentChainIdToTrack,
        from_network: currentChainIdToTrack,
        to_network: chainIdToTrack,
      },
    });
  };

  const isDiscoverBtnEnabled = useCallback(
    (hexChainId: Hex): boolean => {
      return (
        (isNetworkDiscoverButtonEnabled as Record<Hex, boolean>)?.[
          hexChainId
        ] && CHAIN_ID_PROFOLIO_LANDING_PAGE_URL_MAP[hexChainId] !== undefined
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
        return {};
      }

      const hexChainId = convertCaipToHexChainId(chainId);
      const isDeletable =
        isUnlocked &&
        network.chainId !== currentChainId &&
        network.chainId !== EthScope.Mainnet;

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
              nickname: network.name,
            }),
          );
        },
        onDiscoverClick: isDiscoverBtnEnabled(hexChainId)
          ? () => {
              openWindow(
                CHAIN_ID_PROFOLIO_LANDING_PAGE_URL_MAP[hexChainId],
                '_blank',
              );
            }
          : undefined,
        onRpcConfigEdit: hasMultiRpcOptions(network)
          ? () => {
              dispatch(
                setEditedNetwork({
                  chainId: hexChainId,
                }),
              );
            }
          : undefined,
      };
    },
    [
      currentChainId,
      dispatch,
      hasMultiRpcOptions,
      isUnlocked,
      isDiscoverBtnEnabled,
    ],
  );

  // Renders a test network in the network list
  const generateTestNetworkListItem = (
    network: MultichainNetworkConfiguration,
  ) => {
    const isCurrentNetwork = network.chainId === currentChainId;
    console.log(
      'isCurrentNetwork',
      isCurrentNetwork,
      network.chainId,
      currentChainId,
    );
    const { onDelete, onEdit, onDiscoverClick, onRpcConfigEdit } =
      getItemCallbacks(network);

    return (
      <NetworkListItem
        key={network.chainId}
        chainId={network.chainId}
        name={network.name}
        iconSize={AvatarNetworkSize.Sm}
        rpcEndpoint={
          hasMultiRpcOptions(network)
            ? getRpcDataByChainId(network.chainId, evmNetworks)
                .defaultRpcEndpoint
            : undefined
        }
        onClick={async () => {
          await handleNetworkChange(network.chainId);
        }}
        onDeleteClick={onDelete}
        onEditClick={onEdit}
        onRpcEndpointClick={onRpcConfigEdit}
        disabled={!isNetworkEnabled(network)}
        selected={isCurrentNetwork}
        focus={false}
        notSelectable={true}
      />
    );
  };

  return (
    <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
      {orderedTestNetworks.map((network) =>
        generateTestNetworkListItem(network),
      )}
    </Box>
  );
};
