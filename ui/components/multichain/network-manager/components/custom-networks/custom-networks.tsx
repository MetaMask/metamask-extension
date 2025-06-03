import { EthScope } from '@metamask/keyring-api';
import {
  NON_EVM_TESTNET_IDS,
  type MultichainNetworkConfiguration,
} from '@metamask/multichain-network-controller';
import { type UpdateNetworkFields } from '@metamask/network-controller';
import { type CaipChainId, type Hex } from '@metamask/utils';
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName
} from '../../../../../../shared/constants/metametrics';
import {
  CHAIN_ID_PROFOLIO_LANDING_PAGE_URL_MAP,
  FEATURED_RPCS,
  TEST_CHAINS
} from '../../../../../../shared/constants/network';
import { endTrace, TraceName } from '../../../../../../shared/lib/trace';
import {
  convertCaipToHexChainId,
  getNetworkIcon,
  getRpcDataByChainId,
  sortNetworks,
} from '../../../../../../shared/modules/network.utils';
import { MetaMetricsContext } from '../../../../../contexts/metametrics';
import {
  getCompletedOnboarding,
  getIsUnlocked,
} from '../../../../../ducks/metamask/metamask';
import {
  AlignItems,
  Display,
  FlexDirection,
  JustifyContent,
  TextColor
} from '../../../../../helpers/constants/design-system';
import { openWindow } from '../../../../../helpers/utils/window';
import { useAccountCreationOnNetworkChange } from '../../../../../hooks/accounts/useAccountCreationOnNetworkChange';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  getAllChainsToPoll,
  getAllDomains,
  getAllEnabledNetworks,
  getEditedNetwork,
  getIsAccessedFromDappConnectedSitePopover,
  getIsAddingNewNetwork,
  getIsMultiRpcOnboarding,
  getMultichainNetworkConfigurationsByChainId,
  getNetworkDiscoverButtonEnabled,
  getOrderedNetworksList,
  getOriginOfCurrentTab,
  getPermittedEVMAccountsForSelectedTab,
  getPermittedEVMChainsForSelectedTab,
  getPreferences,
  getSelectedMultichainNetworkChainId,
  getShowTestNetworks,
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
  Box,
  ButtonLink,
  ButtonLinkSize,
  IconName,
  IconSize
} from '../../../../component-library';
import { NetworkListItem } from '../../../network-list-item';

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

export const CustomNetworks = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);
  const { hasAnyAccountsInNetwork } = useAccountCreationOnNetworkChange();

  const { tokenNetworkFilter } = useSelector(getPreferences);
  const showTestnets = useSelector(getShowTestNetworks);
  const selectedTabOrigin = useSelector(getOriginOfCurrentTab);
  const isUnlocked = useSelector(getIsUnlocked);
  const domains = useSelector(getAllDomains);
  const orderedNetworksList = useSelector(getOrderedNetworksList);
  const customNetworks = useSelector(getAllEnabledNetworks);
  console.log(`customNetworks`, customNetworks);
  const isAddingNewNetwork = useSelector(getIsAddingNewNetwork);
  const isMultiRpcOnboarding = useSelector(getIsMultiRpcOnboarding);
  const isAccessedFromDappConnectedSitePopover = useSelector(
    getIsAccessedFromDappConnectedSitePopover,
  );
  const completedOnboarding = useSelector(getCompletedOnboarding);
  // This selector provides the indication if the "Discover" button
  // is enabled based on the remote feature flag.
  const isNetworkDiscoverButtonEnabled = useSelector(
    getNetworkDiscoverButtonEnabled,
  );
  // This selector provides an array with two elements.
  // 1 - All network configurations including EVM and non-EVM with the data type
  // MultichainNetworkConfiguration from @metamask/multichain-network-controller
  // 2 - All EVM network configurations with the data type NetworkConfiguration
  // from @metamask/network-controller. It includes necessary data like
  // the RPC endpoints that are not part of @metamask/multichain-network-controller.
  const [multichainNetworks, evmNetworks] = useSelector(
    getMultichainNetworkConfigurationsByChainId,
  );
  const history = useHistory();
  const currentChainId = useSelector(getSelectedMultichainNetworkChainId);
  const { chainId: editingChainId, editCompleted } =
    useSelector(getEditedNetwork) ?? {};
  const permittedChainIds = useSelector((state) =>
    getPermittedEVMChainsForSelectedTab(state, selectedTabOrigin),
  );

  const permittedAccountAddresses = useSelector((state) =>
    getPermittedEVMAccountsForSelectedTab(state, selectedTabOrigin),
  );

  const allChainIds = useSelector(getAllChainsToPoll);
  const canSelectNetwork: boolean =
    !process.env.REMOVE_GNS ||
    (Boolean(process.env.REMOVE_GNS) &&
      Boolean(selectedTabOrigin) &&
      Boolean(domains[selectedTabOrigin]) &&
      isAccessedFromDappConnectedSitePopover);

  useEffect(() => {
    endTrace({ name: TraceName.NetworkList });
  }, []);

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

  // The network currently being edited, or undefined
  // if the user is not currently editing a network.
  //
  // The memoized value is EVM specific, therefore we
  // provide the evmNetworks object as a dependency.
  const editedNetwork = useMemo(
    (): UpdateNetworkFields | undefined =>
      !editingChainId || editCompleted
        ? undefined
        : Object.entries(evmNetworks).find(
            ([chainId]) => chainId === editingChainId,
          )?.[1],
    [editingChainId, editCompleted, evmNetworks],
  );

  // Tracks which page the user is on
  const [actionMode, setActionMode] = useState(
    isAddingNewNetwork || editedNetwork
      ? ACTION_MODE.ADD_EDIT
      : ACTION_MODE.LIST,
  );

  const [orderedNetworks, setOrderedNetworks] = useState(
    sortNetworks(nonTestNetworks, orderedNetworksList),
  );

  const [orderedTestNetworks, setOrderedTestNetworks] = useState(
    sortNetworks(testNetworks, orderedNetworksList),
  );

  useEffect(
    () =>
      setOrderedNetworks(sortNetworks(nonTestNetworks, orderedNetworksList)),
    [nonTestNetworks, orderedNetworksList],
  );

  const featuredNetworksNotYetEnabled = useMemo(
    () =>
      FEATURED_RPCS.filter(({ chainId }) => !evmNetworks[chainId]).sort(
        (a, b) => a.name.localeCompare(b.name),
      ),
    [evmNetworks],
  );

  // This value needs to be tracked in case the user changes to a Non EVM
  // network and there is no account created for that network. This will
  // allow the user to add an account for that network.
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

    // as a user, I don't want my network selection to force update my filter
    // when I have "All Networks" toggled on however, if I am already filtered
    // on "Current Network", we'll want to filter by the selected network when
    // the network changes.
    if (Object.keys(tokenNetworkFilter || {}).length <= 1) {
      dispatch(setTokenNetworkFilter({ [hexChainId]: true }));
    } else {
      const allOpts = Object.keys(evmNetworks).reduce((acc, id) => {
        acc[id] = true;
        return acc;
      }, {} as Record<string, boolean>);
      dispatch(setTokenNetworkFilter(allOpts));
    }

    // If presently on a dapp, communicate a change to
    // the dapp via silent switchEthereumChain that the
    // network has changed due to user action
    if (selectedTabOrigin && domains[selectedTabOrigin]) {
      // setActiveNetwork should be called before setNetworkClientIdForDomain
      // to ensure that the isConnected value can be accurately inferred from
      // NetworkController.state.networksMetadata in return value of
      // `metamask_getProviderState` requests and `metamask_chainChanged` events.
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

    setSelectedNonEvmNetwork(chainId);
    setActionMode(ACTION_MODE.ADD_NON_EVM_ACCOUNT);
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
      // The "Discover" button should be enabled when the mapping for the chainId is enabled in the feature flag json
      // and in the constants `CHAIN_ID_PROFOLIO_LANDING_PAGE_URL_MAP`.
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

      // Non-EVM networks cannot be deleted, edited or have
      // RPC endpoints so it's safe to call this conversion function here.
      const hexChainId = convertCaipToHexChainId(chainId);
      const isDeletable =
        isUnlocked &&
        network.chainId !== currentChainId &&
        network.chainId !== EthScope.Mainnet;

      return {
        onDelete: isDeletable
          ? () => {
              dispatch(
                showModal({
                  name: 'CONFIRM_DELETE_NETWORK',
                  target: hexChainId,
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
              history.push('/add-rpc');
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

  // Renders a network in the network list
  const generateMultichainNetworkListItem = (
    network: MultichainNetworkConfiguration,
  ) => {
    const isCurrentNetwork = network.chainId === currentChainId;
    const networkChainId = network.chainId; // eip155:59144
    // Convert CAIP format to hex format for comparison
    const hexChainId = network.isEvm
      ? convertCaipToHexChainId(networkChainId)
      : networkChainId;

    console.log(`network`, network, hexChainId);

    // Check if the network is enabled by looking at allEnabledNetworks keys
    const findInAllEnabledNetworks = Object.values(customNetworks).filter(
      (network: any) => network.networkType === 'custom',
    );
    const isCustomNetwork = findInAllEnabledNetworks.find(
      (network: any) => network.chainId === hexChainId,
    );
    if (!isCustomNetwork) {
      return null;
    }

    const { onDelete, onEdit, onDiscoverClick, onRpcConfigEdit } =
      getItemCallbacks(network);
    const iconSrc = getNetworkIcon(network);

    return (
      <NetworkListItem
        key={network.chainId}
        chainId={network.chainId}
        name={network.name}
        iconSrc={iconSrc}
        iconSize={AvatarNetworkSize.Md}
        rpcEndpoint={
          hasMultiRpcOptions(network)
            ? getRpcDataByChainId(network.chainId, evmNetworks)
              .defaultRpcEndpoint
            : undefined
        }
        onClick={async () => {
          if (canSelectNetwork) {
            await handleNetworkChange(network.chainId);
          }
        }}
        onDeleteClick={onDelete}
        onEditClick={onEdit}
        onDiscoverClick={onDiscoverClick}
        selected={isCurrentNetwork}
        onRpcEndpointClick={onRpcConfigEdit}
        disabled={!isNetworkEnabled(network)}
        notSelectable={!canSelectNetwork}
      />
    );
  };

  return (
    <>
      <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
        {[...orderedNetworks, ...orderedTestNetworks].map((network) =>
          generateMultichainNetworkListItem(network),
        )}
      </Box>
      <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
        <ButtonLink
          size={ButtonLinkSize.Md}
          startIconProps={{
            size: IconSize.Lg,
          }}
          alignItems={AlignItems.center}
          justifyContent={JustifyContent.flexStart}
          color={TextColor.textDefault}
          startIconName={IconName.Add}
          onClick={() => {
            history.push('/add');
          }}
        >
          Add Custom  Network
        </ButtonLink>
      </Box>
    </>
  );
};
