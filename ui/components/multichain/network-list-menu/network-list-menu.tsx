import React, {
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from 'react-beautiful-dnd';
import { useDispatch, useSelector } from 'react-redux';
import Fuse from 'fuse.js';
import * as URI from 'uri-js';
import { EthScope } from '@metamask/keyring-api';
import {
  RpcEndpointType,
  type UpdateNetworkFields,
} from '@metamask/network-controller';
import {
  NON_EVM_TESTNET_IDS,
  toEvmCaipChainId,
  type MultichainNetworkConfiguration,
} from '@metamask/multichain-network-controller';
import {
  type CaipChainId,
  type Hex,
  parseCaipChainId,
  KnownCaipNamespace,
} from '@metamask/utils';
import { ChainId } from '@metamask/controller-utils';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useAccountCreationOnNetworkChange } from '../../../hooks/accounts/useAccountCreationOnNetworkChange';
import { NetworkListItem } from '../network-list-item';
import {
  setActiveNetwork,
  setShowTestNetworks,
  showModal,
  toggleNetworkMenu,
  updateNetworksList,
  setNetworkClientIdForDomain,
  setEditedNetwork,
  showPermittedNetworkToast,
  updateCustomNonce,
  setNextNonce,
  addPermittedChain,
  setTokenNetworkFilter,
  detectNfts,
  setEnabledNetworks,
} from '../../../store/actions';
import {
  FEATURED_RPCS,
  TEST_CHAINS,
  CHAIN_ID_PORTFOLIO_LANDING_PAGE_URL_MAP,
  BUILT_IN_NETWORKS,
} from '../../../../shared/constants/network';
import {
  MULTICHAIN_NETWORK_TO_ACCOUNT_TYPE_NAME,
  MultichainNetworks,
} from '../../../../shared/constants/multichain/networks';
import {
  getShowTestNetworks,
  getOriginOfCurrentTab,
  getEditedNetwork,
  getOrderedNetworksList,
  getIsAddingNewNetwork,
  getIsMultiRpcOnboarding,
  getIsAccessedFromDappConnectedSitePopover,
  getAllDomains,
  getPermittedEVMChainsForSelectedTab,
  getPreferences,
  getMultichainNetworkConfigurationsByChainId,
  getSelectedMultichainNetworkChainId,
  getNetworkDiscoverButtonEnabled,
  getAllChainsToPoll,
} from '../../../selectors';
import ToggleButton from '../../ui/toggle-button';
import {
  Display,
  FlexDirection,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  Box,
  ButtonSecondary,
  ButtonSecondarySize,
  Modal,
  ModalOverlay,
  Text,
  IconName,
  ModalContent,
  ModalHeader,
  AvatarNetworkSize,
} from '../../component-library';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import {
  convertCaipToHexChainId,
  sortNetworks,
  getNetworkIcon,
  getRpcDataByChainId,
  sortNetworksByPrioity,
} from '../../../../shared/modules/network.utils';
import {
  getCompletedOnboarding,
  getIsUnlocked,
} from '../../../ducks/metamask/metamask';
import NetworksForm from '../../../pages/settings/networks-tab/networks-form';
import { useNetworkFormState } from '../../../pages/settings/networks-tab/networks-form/networks-form-state';
import { openWindow } from '../../../helpers/utils/window';
import { endTrace, TraceName } from '../../../../shared/lib/trace';
import PopularNetworkList from './popular-network-list/popular-network-list';
import NetworkListSearch from './network-list-search/network-list-search';
import AddRpcUrlModal from './add-rpc-url-modal/add-rpc-url-modal';
import { SelectRpcUrlModal } from './select-rpc-url-modal/select-rpc-url-modal';
import AddBlockExplorerModal from './add-block-explorer-modal/add-block-explorer-modal';
import AddNonEvmAccountModal from './add-non-evm-account/add-non-evm-account';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export enum ACTION_MODE {
  // Displays the search box and network list
  LIST,
  // Displays the form to add or edit a network
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  ADD_EDIT,
  // Displays the page for adding an additional RPC URL
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  ADD_RPC,
  // Displays the page for adding an additional explorer URL
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  ADD_EXPLORER_URL,
  // Displays the page for selecting an RPC URL
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  SELECT_RPC,
  // Add account for non EVM networks
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  ADD_NON_EVM_ACCOUNT,
}

type NetworkListMenuProps = {
  onClose: () => void;
};

export const NetworkListMenu = ({ onClose }: NetworkListMenuProps) => {
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
  const currentChainId = useSelector(getSelectedMultichainNetworkChainId);
  const {
    chainId: editingChainId,
    editCompleted,
    trackRpcUpdateFromBanner,
  } = useSelector(getEditedNetwork) ?? {};
  const permittedChainIds = useSelector((state) =>
    getPermittedEVMChainsForSelectedTab(state, selectedTabOrigin),
  );

  const allChainIds = useSelector(getAllChainsToPoll);
  const canSelectNetwork: boolean =
    Boolean(selectedTabOrigin) &&
    Boolean(domains[selectedTabOrigin]) &&
    isAccessedFromDappConnectedSitePopover;

  useEffect(() => {
    endTrace({ name: TraceName.NetworkList });
  }, []);

  const currentlyOnTestnet = useMemo(() => {
    const { namespace } = parseCaipChainId(currentChainId);
    if (namespace === KnownCaipNamespace.Eip155) {
      return TEST_CHAINS.includes(convertCaipToHexChainId(currentChainId));
    }
    return NON_EVM_TESTNET_IDS.includes(currentChainId);
  }, [currentChainId]);

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

  const networkFormState = useNetworkFormState(editedNetwork);
  const { rpcUrls, setRpcUrls, blockExplorers, setBlockExplorers } =
    networkFormState;

  const [orderedNetworks, setOrderedNetworks] = useState(
    sortNetworks(nonTestNetworks, orderedNetworksList),
  );

  useEffect(
    () =>
      setOrderedNetworks(sortNetworks(nonTestNetworks, orderedNetworksList)),
    [nonTestNetworks, orderedNetworksList],
  );

  // Re-orders networks when the user drag + drops them
  const onDragEnd = (result: DropResult) => {
    if (result.destination) {
      const newOrderedNetworks = [...orderedNetworks];
      const [removed] = newOrderedNetworks.splice(result.source.index, 1);
      newOrderedNetworks.splice(result.destination.index, 0, removed);
      dispatch(updateNetworksList(newOrderedNetworks.map((n) => n.chainId)));
      setOrderedNetworks(newOrderedNetworks);
    }
  };

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

  // Searches networks by user input
  const [searchQuery, setSearchQuery] = useState('');
  const [focusSearch, setFocusSearch] = useState(false);

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const searchNetworks = <T,>(networks: T[], query: string) =>
    searchQuery === ''
      ? networks
      : new Fuse(networks, {
          threshold: 0.2,
          location: 0,
          distance: 100,
          maxPatternLength: 32,
          minMatchCharLength: 1,
          shouldSort: false, // Maintain network order instead of ordering by search score
          keys: ['name', 'chainId', 'nativeCrrency'],
        }).search(query);

  const searchedEnabledNetworks = searchNetworks(orderedNetworks, searchQuery);
  const searchedFeaturedNetworks = searchNetworks(
    featuredNetworksNotYetEnabled,
    searchQuery,
  );
  const searchedTestNetworks = searchNetworks(
    Object.values(testNetworks),
    searchQuery,
  );
  // A sorted list of test networks that put Sepolia first then Linea Sepolia at the top
  // and the rest of the test networks in alphabetical order.
  const sortedTestNetworks = useMemo(() => {
    return sortNetworksByPrioity(searchedTestNetworks, [
      toEvmCaipChainId(ChainId.sepolia),
      toEvmCaipChainId(ChainId['linea-sepolia']),
    ]);
  }, [searchedTestNetworks]);

  const getMultichainNetworkConfigurationOrThrow = (chainId: CaipChainId) => {
    const network = multichainNetworks[chainId];
    if (!network) {
      throw new Error(
        `Network configuration not found for chainId: ${chainId}`,
      );
    }
    return network;
  };

  const handleEvmNetworkChange = async (
    chainId: CaipChainId,
    networkClientId?: string,
  ) => {
    try {
      const hexChainId = convertCaipToHexChainId(chainId);
      const { defaultRpcEndpoint } = getRpcDataByChainId(chainId, evmNetworks);
      const finalNetworkClientId =
        networkClientId ?? defaultRpcEndpoint.networkClientId;

      if (isAccessedFromDappConnectedSitePopover && selectedTabOrigin) {
        const isNetworkPermitted = permittedChainIds.includes(hexChainId);

        if (!isNetworkPermitted) {
          await dispatch(addPermittedChain(selectedTabOrigin, chainId));
          dispatch(showPermittedNetworkToast());
        }

        dispatch(
          setNetworkClientIdForDomain(selectedTabOrigin, finalNetworkClientId),
        );
      }

      dispatch(setActiveNetwork(finalNetworkClientId));
      dispatch(updateCustomNonce(''));
      dispatch(setNextNonce(''));
      dispatch(detectNfts(allChainIds));

      if (Object.keys(tokenNetworkFilter || {}).length <= 1) {
        dispatch(setTokenNetworkFilter({ [hexChainId]: true }));
      } else {
        const allOpts = Object.keys(evmNetworks).reduce(
          (acc, id) => {
            acc[id] = true;
            return acc;
          },
          {} as Record<string, boolean>,
        );
        dispatch(setTokenNetworkFilter(allOpts));
      }

      dispatch(setEnabledNetworks(hexChainId));
    } finally {
      dispatch(toggleNetworkMenu());
    }
  };

  const handleNonEvmNetworkChange = async (chainId: CaipChainId) => {
    if (hasAnyAccountsInNetwork(chainId)) {
      dispatch(toggleNetworkMenu());
      dispatch(setActiveNetwork(chainId));

      dispatch(setEnabledNetworks(chainId));

      return;
    }

    setSelectedNonEvmNetwork(chainId);
    setActionMode(ACTION_MODE.ADD_NON_EVM_ACCOUNT);
  };

  const handleNetworkChange = async (chainId: CaipChainId) => {
    const currentChain =
      getMultichainNetworkConfigurationOrThrow(currentChainId);
    const chain = getMultichainNetworkConfigurationOrThrow(chainId);

    if (chain.isEvm) {
      await handleEvmNetworkChange(chainId);
    } else {
      await handleNonEvmNetworkChange(chainId);
    }

    const chainIdToTrack = chain.isEvm
      ? convertCaipToHexChainId(chainId)
      : chainId;
    const currentChainIdToTrack = currentChain.isEvm
      ? convertCaipToHexChainId(currentChainId)
      : currentChainId;

    // Check if the destination network is custom (not built-in, featured, or multichain)
    const hexChainId = chain.isEvm
      ? convertCaipToHexChainId(chain.chainId)
      : chain.chainId;

    const isBuiltInNetwork = Object.values(BUILT_IN_NETWORKS).some(
      (builtInNetwork) => builtInNetwork.chainId === hexChainId,
    );
    const isFeaturedRpc = FEATURED_RPCS.some(
      (featuredRpc) => featuredRpc.chainId === hexChainId,
    );
    const isMultichainProviderConfig = Object.values(MultichainNetworks).some(
      (multichainNetwork) =>
        multichainNetwork === chain.chainId ||
        (chain.isEvm
          ? convertCaipToHexChainId(chain.chainId)
          : chain.chainId) === multichainNetwork,
    );

    const isCustomNetwork =
      !isBuiltInNetwork && !isFeaturedRpc && !isMultichainProviderConfig;

    trackEvent({
      event: MetaMetricsEventName.NavNetworkSwitched,
      category: MetaMetricsEventCategory.Network,
      properties: {
        location: 'Network Menu',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        chain_id: currentChainIdToTrack,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        from_network: currentChainIdToTrack,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        to_network: chainIdToTrack,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        custom_network: isCustomNetwork,
      },
    });
  };

  const isDiscoverBtnEnabled = useCallback(
    (chainId: Hex | `${string}:${string}`): boolean => {
      // The "Discover" button should be enabled when the mapping for the chainId is enabled in the feature flag json
      // and in the constants `CHAIN_ID_PORTFOLIO_LANDING_PAGE_URL_MAP`.
      return (
        Boolean(
          isNetworkDiscoverButtonEnabled?.[
            chainId as keyof typeof isNetworkDiscoverButtonEnabled
          ],
        ) && CHAIN_ID_PORTFOLIO_LANDING_PAGE_URL_MAP[chainId] !== undefined
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
        (isUnlocked && completedOnboarding) ||
        hasAnyAccountsInNetwork(network.chainId)
      );
    },
    [isUnlocked, completedOnboarding, hasAnyAccountsInNetwork],
  );

  const getItemCallbacks = useCallback(
    (
      network: MultichainNetworkConfiguration,
    ): Record<string, (() => void) | undefined> => {
      const { chainId, isEvm } = network;

      if (!isEvm) {
        return {
          onDiscoverClick: isDiscoverBtnEnabled(chainId)
            ? () => {
                openWindow(
                  CHAIN_ID_PORTFOLIO_LANDING_PAGE_URL_MAP[chainId],
                  '_blank',
                );
              }
            : undefined,
        };
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
          setActionMode(ACTION_MODE.ADD_EDIT);
        },
        onDiscoverClick: isDiscoverBtnEnabled(hexChainId)
          ? () => {
              openWindow(
                CHAIN_ID_PORTFOLIO_LANDING_PAGE_URL_MAP[hexChainId],
                '_blank',
              );
            }
          : undefined,
        onRpcConfigEdit: hasMultiRpcOptions(network)
          ? () => {
              setActionMode(ACTION_MODE.SELECT_RPC);
              dispatch(
                setEditedNetwork({
                  chainId: hexChainId,
                }),
              );
            }
          : undefined,
        onRpcSelect: () => {
          setActionMode(ACTION_MODE.SELECT_RPC);
          dispatch(
            setEditedNetwork({
              chainId: hexChainId,
            }),
          );
        },
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
    const { onDelete, onEdit, onDiscoverClick, onRpcSelect } =
      getItemCallbacks(network);
    const iconSrc = getNetworkIcon(network);

    return (
      <NetworkListItem
        key={network.chainId}
        chainId={network.chainId}
        name={network.name}
        iconSrc={iconSrc}
        iconSize={AvatarNetworkSize.Sm}
        selected={canSelectNetwork && isCurrentNetwork && !focusSearch}
        focus={canSelectNetwork && isCurrentNetwork && !focusSearch}
        rpcEndpoint={
          hasMultiRpcOptions(network)
            ? getRpcDataByChainId(network.chainId, evmNetworks)
                .defaultRpcEndpoint
            : undefined
        }
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onClick={async () => {
          if (canSelectNetwork) {
            await handleNetworkChange(network.chainId);
          }
        }}
        onDeleteClick={onDelete}
        onEditClick={onEdit}
        onDiscoverClick={onDiscoverClick}
        onRpcEndpointClick={onRpcSelect}
        disabled={!isNetworkEnabled(network)}
        notSelectable={!canSelectNetwork}
      />
    );
  };

  const render = () => {
    if (actionMode === ACTION_MODE.LIST) {
      return (
        <>
          <Box className="multichain-network-list-menu">
            <NetworkListSearch
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              setFocusSearch={setFocusSearch}
            />
            <Box>
              {searchedEnabledNetworks.length > 0 && (
                <Box
                  padding={4}
                  display={Display.Flex}
                  justifyContent={JustifyContent.spaceBetween}
                >
                  <Text color={TextColor.textAlternative}>
                    {t('enabledNetworks')}
                  </Text>
                </Box>
              )}

              {searchedEnabledNetworks.length === 0 &&
              searchedFeaturedNetworks.length === 0 &&
              searchedTestNetworks.length === 0 &&
              focusSearch ? (
                <Text
                  paddingLeft={4}
                  paddingRight={4}
                  color={TextColor.textMuted}
                  data-testid="multichain-network-menu-popover-no-results"
                >
                  {t('noNetworksFound')}
                </Text>
              ) : (
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="characters">
                    {(provided) => (
                      <Box
                        className="characters"
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                      >
                        {searchedEnabledNetworks.map((network, index) => {
                          return (
                            <Draggable
                              key={network.chainId}
                              draggableId={network.chainId}
                              index={index}
                            >
                              {(providedDrag) => (
                                <Box
                                  ref={providedDrag.innerRef}
                                  {...providedDrag.draggableProps}
                                  {...providedDrag.dragHandleProps}
                                >
                                  {generateMultichainNetworkListItem(network)}
                                </Box>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </Box>
                    )}
                  </Droppable>
                </DragDropContext>
              )}

              <PopularNetworkList
                searchAddNetworkResults={searchedFeaturedNetworks}
                data-testid="add-popular-network-view"
              />
              {searchedTestNetworks.length > 0 ? (
                <Box
                  paddingBottom={4}
                  paddingTop={4}
                  paddingLeft={4}
                  display={Display.Flex}
                  justifyContent={JustifyContent.spaceBetween}
                >
                  <Text color={TextColor.textAlternative}>
                    {t('showTestnetNetworks')}
                  </Text>
                  <ToggleButton
                    value={showTestnets || currentlyOnTestnet}
                    disabled={currentlyOnTestnet}
                    onToggle={(value: boolean) => {
                      const newVal = !value;
                      dispatch(setShowTestNetworks(newVal));
                      trackEvent({
                        event: MetaMetricsEventName.TestNetworksDisplayed,
                        category: MetaMetricsEventCategory.Network,
                        properties: {
                          value: newVal,
                        },
                      });
                    }}
                  />
                </Box>
              ) : null}

              {showTestnets || currentlyOnTestnet ? (
                <Box className="multichain-network-list-menu">
                  {sortedTestNetworks.map((network) =>
                    generateMultichainNetworkListItem(network),
                  )}
                </Box>
              ) : null}
            </Box>
          </Box>

          <Box padding={4}>
            <ButtonSecondary
              size={ButtonSecondarySize.Lg}
              startIconName={IconName.Add}
              startIconProps={{ marginRight: 2 }}
              block
              onClick={() => {
                trackEvent({
                  event: MetaMetricsEventName.AddNetworkButtonClick,
                  category: MetaMetricsEventCategory.Network,
                });
                setActionMode(ACTION_MODE.ADD_EDIT);
              }}
            >
              {t('addACustomNetwork')}
            </ButtonSecondary>
          </Box>
        </>
      );
    } else if (actionMode === ACTION_MODE.ADD_EDIT) {
      return (
        <NetworksForm
          networkFormState={networkFormState}
          existingNetwork={editedNetwork}
          trackRpcUpdateFromBanner={trackRpcUpdateFromBanner}
          onRpcAdd={() => setActionMode(ACTION_MODE.ADD_RPC)}
          onBlockExplorerAdd={() => setActionMode(ACTION_MODE.ADD_EXPLORER_URL)}
        />
      );
    } else if (actionMode === ACTION_MODE.ADD_RPC) {
      return (
        <AddRpcUrlModal
          onAdded={(url, name) => {
            // Note: We could choose to rename the URL if it already exists with a different name
            if (rpcUrls.rpcEndpoints?.every((e) => !URI.equal(e.url, url))) {
              setRpcUrls({
                rpcEndpoints: [
                  ...rpcUrls.rpcEndpoints,
                  { url, name, type: RpcEndpointType.Custom },
                ],
                defaultRpcEndpointIndex: rpcUrls.rpcEndpoints.length,
              });
            }
            setActionMode(ACTION_MODE.ADD_EDIT);
          }}
        />
      );
    } else if (actionMode === ACTION_MODE.ADD_EXPLORER_URL) {
      return (
        <AddBlockExplorerModal
          onAdded={(url) => {
            if (blockExplorers.blockExplorerUrls?.every((u) => u !== url)) {
              setBlockExplorers({
                blockExplorerUrls: [...blockExplorers.blockExplorerUrls, url],
                defaultBlockExplorerUrlIndex:
                  blockExplorers.blockExplorerUrls.length,
              });
            }
            setActionMode(ACTION_MODE.ADD_EDIT);
          }}
        />
      );
    } else if (actionMode === ACTION_MODE.SELECT_RPC && editedNetwork) {
      return (
        <SelectRpcUrlModal
          networkConfiguration={evmNetworks[editedNetwork.chainId]}
          onNetworkChange={handleEvmNetworkChange}
        />
      );
    } else if (
      actionMode === ACTION_MODE.ADD_NON_EVM_ACCOUNT &&
      selectedNonEvmNetwork
    ) {
      return <AddNonEvmAccountModal chainId={selectedNonEvmNetwork} />;
    }
    return null; // Should not be reachable
  };

  let title;
  if (actionMode === ACTION_MODE.LIST) {
    title = t('manageNetworksMenuHeading');
  } else if (actionMode === ACTION_MODE.ADD_EDIT && !editedNetwork) {
    title = t('addACustomNetwork');
  } else if (actionMode === ACTION_MODE.ADD_RPC) {
    title = t('addRpcUrl');
  } else if (actionMode === ACTION_MODE.ADD_EXPLORER_URL) {
    title = t('addBlockExplorerUrl');
  } else if (actionMode === ACTION_MODE.SELECT_RPC) {
    title = t('selectRpcUrl');
  } else if (
    actionMode === ACTION_MODE.ADD_NON_EVM_ACCOUNT &&
    selectedNonEvmNetwork
  ) {
    title = t('addNonEvmAccount', [
      MULTICHAIN_NETWORK_TO_ACCOUNT_TYPE_NAME[selectedNonEvmNetwork],
    ]);
  } else {
    title = editedNetwork?.name ?? '';
  }

  let onBack;
  if (actionMode === ACTION_MODE.ADD_EDIT) {
    onBack = () => {
      editedNetwork ? dispatch(setEditedNetwork()) : networkFormState.clear();

      setActionMode(ACTION_MODE.LIST);
    };
  } else if (
    actionMode === ACTION_MODE.ADD_RPC ||
    actionMode === ACTION_MODE.ADD_EXPLORER_URL
  ) {
    onBack = () => setActionMode(ACTION_MODE.ADD_EDIT);
  } else if (actionMode === ACTION_MODE.ADD_NON_EVM_ACCOUNT) {
    onBack = () => setActionMode(ACTION_MODE.LIST);
  }

  if (isMultiRpcOnboarding) {
    onBack = onClose;
  }

  return (
    <Modal isOpen onClose={onClose}>
      <ModalOverlay />
      <ModalContent
        padding={0}
        className="multichain-network-list-menu-content-wrapper"
        modalDialogProps={{
          className: 'multichain-network-list-menu-content-wrapper__dialog',
          display: Display.Flex,
          flexDirection: FlexDirection.Column,
          paddingTop: 0,
          paddingBottom: 0,
        }}
      >
        <ModalHeader
          paddingTop={4}
          paddingRight={4}
          paddingBottom={actionMode === ACTION_MODE.SELECT_RPC ? 0 : 4}
          onClose={onClose}
          onBack={onBack}
        >
          <Text
            ellipsis
            variant={TextVariant.headingSm}
            textAlign={TextAlign.Center}
          >
            {title}
          </Text>
        </ModalHeader>
        {render()}
      </ModalContent>
    </Modal>
  );
};
