import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from 'react-beautiful-dnd';
import { useDispatch, useSelector } from 'react-redux';
import Fuse from 'fuse.js';
import * as URI from 'uri-js';
import {
  RpcEndpointType,
  type UpdateNetworkFields,
} from '@metamask/network-controller';
import { type MultichainNetworkConfiguration } from '@metamask/multichain-network-controller';
import { type CaipChainId, type Hex } from '@metamask/utils';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useAccountCreationOnNetworkChange } from '../../../hooks/accounts/useAccountCreationOnNetworkChange';
import { NetworkListItem } from '../network-list-item';
import {
  hideNetworkBanner,
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
} from '../../../store/actions';
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  FEATURED_RPCS,
  TEST_CHAINS,
} from '../../../../shared/constants/network';
import { MULTICHAIN_TOKEN_IMAGE_MAP } from '../../../../shared/constants/multichain/networks';
import {
  getNetworkConfigurationsByChainId,
  getCurrentChainId,
} from '../../../../shared/modules/selectors/networks';
import {
  getShowTestNetworks,
  getOnboardedInThisUISession,
  getShowNetworkBanner,
  getOriginOfCurrentTab,
  getEditedNetwork,
  getOrderedNetworksList,
  getIsAddingNewNetwork,
  getIsMultiRpcOnboarding,
  getAllDomains,
  getPermittedChainsForSelectedTab,
  getPermittedAccountsForSelectedTab,
  getPreferences,
  getMultichainNetworkConfigurationsByChainId,
} from '../../../selectors';
import ToggleButton from '../../ui/toggle-button';
import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
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
  BannerBase,
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
} from '../../../../shared/modules/network.utils';
import {
  getCompletedOnboarding,
  getIsUnlocked,
} from '../../../ducks/metamask/metamask';
import NetworksForm from '../../../pages/settings/networks-tab/networks-form';
import { useNetworkFormState } from '../../../pages/settings/networks-tab/networks-form/networks-form-state';
import PopularNetworkList from './popular-network-list/popular-network-list';
import NetworkListSearch from './network-list-search/network-list-search';
import AddRpcUrlModal from './add-rpc-url-modal/add-rpc-url-modal';
import { SelectRpcUrlModal } from './select-rpc-url-modal/select-rpc-url-modal';
import AddBlockExplorerModal from './add-block-explorer-modal/add-block-explorer-modal';

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

export const NetworkListMenu = ({ onClose }: { onClose: () => void }) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);
  const { createAccount, isAccountInNetwork } =
    useAccountCreationOnNetworkChange();

  const { tokenNetworkFilter } = useSelector(getPreferences);
  const showTestNetworks = useSelector(getShowTestNetworks);
  const currentChainId = useSelector(getCurrentChainId);
  const selectedTabOrigin = useSelector(getOriginOfCurrentTab);
  const isUnlocked = useSelector(getIsUnlocked);
  const domains = useSelector(getAllDomains);
  const orderedNetworksList = useSelector(getOrderedNetworksList);
  const isAddingNewNetwork = useSelector(getIsAddingNewNetwork);
  const isMultiRpcOnboarding = useSelector(getIsMultiRpcOnboarding);
  const completedOnboarding = useSelector(getCompletedOnboarding);
  const onboardedInThisUISession = useSelector(getOnboardedInThisUISession);
  const showNetworkBanner = useSelector(getShowNetworkBanner);
  // This selector provides all network configurations including EVM and non-EVM
  // with the data type MultichainNetworkConfiguration from @metamask/multichain-network-controller
  const multichainNetworks = useSelector(
    getMultichainNetworkConfigurationsByChainId,
  );
  // This selector provides all EVM network configurations with the
  // data type NetworkConfiguration from @metamask/network-controller.
  // It includes necessary data like the RPC endpoints that are not
  // part of @metamask/multichain-network-controller.
  const evmNetworks = useSelector(getNetworkConfigurationsByChainId);
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);
  const { chainId: editingChainId, editCompleted } =
    useSelector(getEditedNetwork) ?? {};
  const permittedChainIds = useSelector((state) =>
    getPermittedChainsForSelectedTab(state, selectedTabOrigin),
  );

  const permittedAccountAddresses = useSelector((state) =>
    getPermittedAccountsForSelectedTab(state, selectedTabOrigin),
  );

  const currentlyOnTestNetwork = (TEST_CHAINS as Hex[]).includes(
    currentChainId,
  );
  const [nonTestNetworks, testNetworks] = useMemo(
    () =>
      Object.entries(multichainNetworks).reduce(
        ([nonTestNetworksList, testNetworksList], [id, network]) => {
          const chainId = network.isEvm ? convertCaipToHexChainId(id) : id;
          const isTest = (TEST_CHAINS as string[]).includes(chainId);
          (isTest ? testNetworksList : nonTestNetworksList)[chainId] = network;
          return [nonTestNetworksList, testNetworksList];
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
  // This memoized value is EVM specific, therefore we
  // provide the networkConfigurations object as a dependency.
  const editedNetwork = useMemo(
    (): UpdateNetworkFields | undefined =>
      !editingChainId || editCompleted
        ? undefined
        : Object.entries(evmNetworks).find(
            ([chainId]) =>
              chainId ===
              convertCaipToHexChainId(editingChainId as CaipChainId),
          )?.[1],
    [editingChainId, editCompleted, evmNetworks],
  );

  // Tracks which page the user is on
  const [actionMode, setActionMode] = useState(
    isAddingNewNetwork || editedNetwork
      ? ACTION_MODES.ADD_EDIT
      : ACTION_MODES.LIST,
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
      FEATURED_RPCS.filter(
        ({ chainId }) => !networkConfigurations[chainId],
      ).sort((a, b) => a.name.localeCompare(b.name)),
    [networkConfigurations],
  );

  // Searches networks by user input
  const [searchQuery, setSearchQuery] = useState('');
  const [focusSearch, setFocusSearch] = useState(false);

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

  const getRpcEndpointsByChainId = (chainId: CaipChainId) => {
    const hexChainId = convertCaipToHexChainId(chainId);
    const evmNetworkConfig = evmNetworks[hexChainId];
    return evmNetworkConfig.rpcEndpoints;
  };

  const getDefaultRpcEndpointByChainId = (chainId: CaipChainId) => {
    const hexChainId = convertCaipToHexChainId(chainId);
    const evmNetworkConfig = evmNetworks[hexChainId];
    const { rpcEndpoints, defaultRpcEndpointIndex } = evmNetworkConfig;
    return rpcEndpoints[defaultRpcEndpointIndex];
  };

  const getClientIdByChainId = (chainId: CaipChainId) => {
    const defaultRpcEndpoint = getDefaultRpcEndpointByChainId(chainId);
    return defaultRpcEndpoint.networkClientId;
  };

  const handleEvmNetworkChange = (chainId: CaipChainId) => {
    const hexChainId = convertCaipToHexChainId(chainId);
    const networkClientId = getClientIdByChainId(chainId);
    dispatch(setActiveNetwork(networkClientId));
    dispatch(updateCustomNonce(''));
    dispatch(setNextNonce(''));
    dispatch(detectNfts());

    dispatch(toggleNetworkMenu());

    // as a user, I don't want my network selection to force update my filter
    // when I have "All Networks" toggled on however, if I am already filtered
    // on "Current Network", we'll want to filter by the selected network when
    // the network changes.
    if (Object.keys(tokenNetworkFilter || {}).length <= 1) {
      dispatch(setTokenNetworkFilter({ [chainId]: true }));
    } else if (process.env.PORTFOLIO_VIEW) {
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
      setNetworkClientIdForDomain(selectedTabOrigin, networkClientId);
    }

    if (permittedAccountAddresses.length > 0) {
      dispatch(addPermittedChain(selectedTabOrigin, hexChainId));
      if (!permittedChainIds.includes(hexChainId)) {
        dispatch(showPermittedNetworkToast());
      }
    }
  };

  const handleNonEvmNetworkChange = async (chainId: CaipChainId) => {
    if (isAccountInNetwork(chainId)) {
      dispatch(toggleNetworkMenu());
      dispatch(setActiveNetwork(chainId));
      return;
    }

    dispatch(toggleNetworkMenu());
    await createAccount(chainId);
  };

  const handleNetworkChange = async (chainId: CaipChainId) => {
    const { isEvm } = multichainNetworks[chainId];
    if (isEvm) {
      handleEvmNetworkChange(chainId);
    } else {
      await handleNonEvmNetworkChange(chainId);
    }

    trackEvent({
      event: MetaMetricsEventName.NavNetworkSwitched,
      category: MetaMetricsEventCategory.Network,
      properties: {
        location: 'Network Menu',
        chain_id: currentChainId,
        from_network: currentChainId,
        to_network: chainId,
      },
    });
  };

  const getNetworkFlags = (network: MultichainNetworkConfiguration) => {
    if (!network.isEvm) {
      return {
        isDeletable: false,
        isEditable: false,
        hasMultiRpcOptions: false,
      };
    }

    return {
      isDeletable:
        isUnlocked &&
        network.chainId !== currentChainId &&
        network.chainId !== 'eip155:1',
      isEditable: true,
      hasMultiRpcOptions: getRpcEndpointsByChainId(network.chainId).length > 1,
    };
  };

  // Renders a network in the network list
  const generateMultichainNetworkListItem = (
    network: MultichainNetworkConfiguration,
  ) => {
    const isCurrentNetwork = network.chainId === currentChainId;
    const { isDeletable, isEditable, hasMultiRpcOptions } =
      getNetworkFlags(network);

    const onDelete = () => {
      dispatch(toggleNetworkMenu());
      dispatch(
        showModal({
          name: 'CONFIRM_DELETE_NETWORK',
          target: network.chainId,
          onConfirm: () => undefined,
        }),
      );
    };

    const onEdit = () => {
      dispatch(
        setEditedNetwork({
          chainId: network.chainId,
          nickname: network.name,
        }),
      );
      setActionMode(ACTION_MODES.ADD_EDIT);
    };

    const onRpcConfigEdit = () => {
      setActionMode(ACTION_MODES.SELECT_RPC);
      dispatch(setEditedNetwork({ chainId: network.chainId }));
    };

    const iconSrc = network.isEvm
      ? CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
          convertCaipToHexChainId(
            network.chainId,
          ) as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
        ]
      : MULTICHAIN_TOKEN_IMAGE_MAP[network.chainId];

    return (
      <NetworkListItem
        key={network.chainId}
        name={network.name}
        iconSrc={iconSrc}
        iconSize={AvatarNetworkSize.Sm}
        selected={isCurrentNetwork && !focusSearch}
        focus={isCurrentNetwork && !focusSearch}
        rpcEndpoint={
          hasMultiRpcOptions
            ? getDefaultRpcEndpointByChainId(network.chainId)
            : undefined
        }
        onClick={async () => {
          await handleNetworkChange(network.chainId);
        }}
        onDeleteClick={isDeletable ? () => onDelete() : undefined}
        onEditClick={isEditable ? () => onEdit() : undefined}
        onRpcEndpointClick={network.isEvm ? undefined : onRpcConfigEdit}
      />
    );
  };

  const render = () => {
    if (actionMode === ACTION_MODES.LIST) {
      return (
        <>
          <Box className="multichain-network-list-menu">
            <NetworkListSearch
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              setFocusSearch={setFocusSearch}
            />
            {completedOnboarding &&
              !onboardedInThisUISession &&
              showNetworkBanner &&
              !searchQuery && (
                <BannerBase
                  marginLeft={4}
                  marginRight={4}
                  borderRadius={BorderRadius.LG}
                  padding={4}
                  marginBottom={4}
                  marginTop={2}
                  backgroundColor={BackgroundColor.backgroundAlternative}
                  startAccessory={
                    <Box
                      display={Display.Flex}
                      alignItems={AlignItems.center}
                      justifyContent={JustifyContent.center}
                    >
                      <img
                        src="./images/dragging-animation.svg"
                        alt="drag-and-drop"
                      />
                    </Box>
                  }
                  onClose={() => hideNetworkBanner()}
                  description={t('dragAndDropBanner')}
                />
              )}
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
                    value={showTestNetworks || currentlyOnTestNetwork}
                    disabled={currentlyOnTestNetwork}
                    onToggle={(value: boolean) => {
                      dispatch(setShowTestNetworks(!value));
                      if (!value) {
                        trackEvent({
                          event: MetaMetricsEventName.TestNetworksDisplayed,
                          category: MetaMetricsEventCategory.Network,
                        });
                      }
                    }}
                  />
                </Box>
              ) : null}

              {showTestNetworks || currentlyOnTestNetwork ? (
                <Box className="multichain-network-list-menu">
                  {searchedTestNetworks.map((network) =>
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
                setActionMode(ACTION_MODES.ADD_EDIT);
              }}
            >
              {t('addACustomNetwork')}
            </ButtonSecondary>
          </Box>
        </>
      );
    } else if (actionMode === ACTION_MODES.ADD_EDIT) {
      return (
        <NetworksForm
          networkFormState={networkFormState}
          existingNetwork={editedNetwork}
          onRpcAdd={() => setActionMode(ACTION_MODES.ADD_RPC)}
          onBlockExplorerAdd={() =>
            setActionMode(ACTION_MODES.ADD_EXPLORER_URL)
          }
        />
      );
    } else if (actionMode === ACTION_MODES.ADD_RPC) {
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
            setActionMode(ACTION_MODES.ADD_EDIT);
          }}
        />
      );
    } else if (actionMode === ACTION_MODES.ADD_EXPLORER_URL) {
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
            setActionMode(ACTION_MODES.ADD_EDIT);
          }}
        />
      );
    } else if (actionMode === ACTION_MODES.SELECT_RPC && editedNetwork) {
      return (
        <SelectRpcUrlModal
          networkConfiguration={networkConfigurations[editedNetwork.chainId]}
          onNetworkChange={handleEvmNetworkChange}
        />
      );
    }
    return null; // Should not be reachable
  };

  let title;
  if (actionMode === ACTION_MODES.LIST) {
    title = t('networkMenuHeading');
  } else if (actionMode === ACTION_MODES.ADD_EDIT && !editedNetwork) {
    title = t('addACustomNetwork');
  } else if (actionMode === ACTION_MODES.ADD_RPC) {
    title = t('addRpcUrl');
  } else if (actionMode === ACTION_MODES.ADD_EXPLORER_URL) {
    title = t('addBlockExplorerUrl');
  } else if (actionMode === ACTION_MODES.SELECT_RPC) {
    title = t('selectRpcUrl');
  } else {
    title = editedNetwork?.name ?? '';
  }

  let onBack;
  if (actionMode === ACTION_MODES.ADD_EDIT) {
    onBack = () => {
      editedNetwork ? dispatch(setEditedNetwork()) : networkFormState.clear();

      setActionMode(ACTION_MODES.LIST);
    };
  } else if (
    actionMode === ACTION_MODES.ADD_RPC ||
    actionMode === ACTION_MODES.ADD_EXPLORER_URL
  ) {
    onBack = () => setActionMode(ACTION_MODES.ADD_EDIT);
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
          paddingBottom={actionMode === ACTION_MODES.SELECT_RPC ? 0 : 4}
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
