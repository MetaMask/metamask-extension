import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { EthScope } from '@metamask/keyring-api';
import { type UpdateNetworkFields } from '@metamask/network-controller';
import {
  NON_EVM_TESTNET_IDS,
  type MultichainNetworkConfiguration,
} from '@metamask/multichain-network-controller';
import {
  type CaipChainId,
  type Hex,
  parseCaipChainId,
  KnownCaipNamespace,
} from '@metamask/utils';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useAccountCreationOnNetworkChange } from '../../../../../hooks/accounts/useAccountCreationOnNetworkChange';
import { NetworkListItem } from '../../../network-list-item';
import {
  setActiveNetwork,
  updateCustomNonce,
  setNextNonce,
  detectNfts,
  toggleNetworkMenu,
  setTokenNetworkFilter,
  setNetworkClientIdForDomain,
  addPermittedChain,
  showPermittedNetworkToast,
  setEditedNetwork,
  showModal,
  requestUserApproval,
} from '../../../../../store/actions';
import {
  FEATURED_RPCS,
  TEST_CHAINS,
  CHAIN_ID_PROFOLIO_LANDING_PAGE_URL_MAP,
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
} from '../../../../../../shared/constants/network';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsNetworkEventSource,
} from '../../../../../../shared/constants/metametrics';
import {
  getShowTestNetworks,
  getOnboardedInThisUISession,
  getShowNetworkBanner,
  getOriginOfCurrentTab,
  getEditedNetwork,
  getOrderedNetworksList,
  getIsAddingNewNetwork,
  getIsMultiRpcOnboarding,
  getIsAccessedFromDappConnectedSitePopover,
  getAllDomains,
  getPermittedEVMChainsForSelectedTab,
  getPermittedEVMAccountsForSelectedTab,
  getPreferences,
  getMultichainNetworkConfigurationsByChainId,
  getSelectedMultichainNetworkChainId,
  getNetworkDiscoverButtonEnabled,
  getAllChainsToPoll,
} from '../../../../../selectors';
import {
  convertCaipToHexChainId,
  sortNetworks,
  getRpcDataByChainId,
  getNetworkIcon,
} from '../../../../../../shared/modules/network.utils';
import {
  getCompletedOnboarding,
  getIsUnlocked,
} from '../../../../../ducks/metamask/metamask';
import { useNetworkFormState } from '../../../../../pages/settings/networks-tab/networks-form/networks-form-state';
import { endTrace, TraceName } from '../../../../../../shared/lib/trace';
import { openWindow } from '../../../../../helpers/utils/window';
import { MetaMetricsContext } from '../../../../../contexts/metametrics';
import {
  Box,
  AvatarNetworkSize,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
  Checkbox,
  AvatarNetwork,
} from '../../../../component-library';
import { AdditionalNetworksInfo } from '../additional-networks-info';
import {
  AlignItems,
  Display,
  FlexDirection,
  JustifyContent,
  BorderRadius,
  TextColor,
  IconColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { ORIGIN_METAMASK } from '../../../../../../shared/constants/app';
import { ApprovalType } from '@metamask/controller-utils';
import { useHistory } from 'react-router-dom';

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

export const DefaultNetworks = () => {
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
                  onConfirm: () => undefined,
                  onHide: () => undefined,
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
    const { onDelete, onEdit, onDiscoverClick, onRpcConfigEdit } =
      getItemCallbacks(network);
    const iconSrc = getNetworkIcon(network);

    return (
      <NetworkListItem
        startAccessory={
          <Checkbox label="" onChange={() => {}} isChecked={true} />
        }
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
        // selected={isCurrentNetwork}
        onRpcEndpointClick={onRpcConfigEdit}
        disabled={!isNetworkEnabled(network)}
        notSelectable={!canSelectNetwork}
      />
    );
  };

  const handleAdditionalNetworkClick = (network: any) => {
    console.log(`network`, network);
    handleAdditionalNetworkCheckboxChange(network);
  };

  const handleAdditionalNetworkCheckboxChange = async (network: any) => {
    await dispatch(
      requestUserApproval({
        origin: ORIGIN_METAMASK,
        type: ApprovalType.AddEthereumChain,
        requestData: {
          chainId: network.chainId,
          rpcUrl: network.rpcEndpoints[network.defaultRpcEndpointIndex].url,
          failoverRpcUrls:
            network.rpcEndpoints[network.defaultRpcEndpointIndex].failoverUrls,
          ticker: network.nativeCurrency,
          rpcPrefs: {
            blockExplorerUrl:
              network.defaultBlockExplorerUrlIndex === undefined
                ? undefined
                : network.blockExplorerUrls[
                    network.defaultBlockExplorerUrlIndex
                  ],
          },
          imageUrl:
            CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
              network.chainId as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
            ],
          chainName: network.name,
          referrer: ORIGIN_METAMASK,
          source: MetaMetricsNetworkEventSource.NewAddNetworkFlow,
        },
      }),
    );
  };

  const generateAdditionalNetworkListItem = (network: any) => {
    const networkImageUrl =
      CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
        network.chainId as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
      ];

    return (
      <Box
        display={Display.Flex}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.spaceBetween}
        onClick={handleAdditionalNetworkClick}
        paddingTop={4}
        paddingBottom={4}
        data-testid="additional-network-item"
      >
        <Box display={Display.Flex} alignItems={AlignItems.center} gap={3}>
          <Box className="additional-network-item__button-icon">
            <ButtonIcon
              size={ButtonIconSize.Lg}
              color={IconColor.iconAlternative}
              iconName={IconName.Add}
              padding={0}
              margin={0}
              ariaLabel={t('addNetwork')}
            />
          </Box>
          <AvatarNetwork
            name={network.name}
            size={AvatarNetworkSize.Md}
            src={networkImageUrl}
            borderRadius={BorderRadius.LG}
          />
          <Text
            variant={TextVariant.bodyMdMedium}
            color={TextColor.textDefault}
          >
            {network.name}
          </Text>
        </Box>
      </Box>
    );
  };

  return (
    <>
      <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
        {orderedNetworks.map((network) =>
          generateMultichainNetworkListItem(network),
        )}
        <AdditionalNetworksInfo />
        {featuredNetworksNotYetEnabled.map((network) =>
          generateAdditionalNetworkListItem(network),
        ) || null}
      </Box>
      <Box display={Display.Flex} flexDirection={FlexDirection.Column}></Box>
    </>
  );
};
