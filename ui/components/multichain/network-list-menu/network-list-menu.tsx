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
  NetworkConfiguration,
  RpcEndpointType,
} from '@metamask/network-controller';
import { Hex } from '@metamask/utils';
import { useI18nContext } from '../../../hooks/useI18nContext';
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
  CHAIN_IDS,
  FEATURED_RPCS,
  TEST_CHAINS,
} from '../../../../shared/constants/network';
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
  const allNetworks = useSelector(getNetworkConfigurationsByChainId);
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
      Object.entries(networkConfigurations).reduce(
        ([nonTestNetworksList, testNetworksList], [chainId, network]) => {
          const isTest = (TEST_CHAINS as string[]).includes(chainId);
          (isTest ? testNetworksList : nonTestNetworksList)[chainId] = network;
          return [nonTestNetworksList, testNetworksList];
        },
        [
          {} as Record<string, NetworkConfiguration>,
          {} as Record<string, NetworkConfiguration>,
        ],
      ),
    [networkConfigurations],
  );

  // The network currently being edited, or undefined
  // if the user is not currently editing a network.
  const editedNetwork = useMemo(
    () =>
      !editingChainId || editCompleted
        ? undefined
        : Object.entries(networkConfigurations).find(
            ([chainId]) => chainId === editingChainId,
          )?.[1],
    [editingChainId, editCompleted, networkConfigurations],
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

  const sortNetworks = (networks: Record<string, NetworkConfiguration>) =>
    Object.values(networks).sort(
      (a, b) =>
        orderedNetworksList.findIndex(
          ({ networkId }) => networkId === a.chainId,
        ) -
        orderedNetworksList.findIndex(
          ({ networkId }) => networkId === b.chainId,
        ),
    );

  const [orderedNetworks, setOrderedNetworks] = useState(
    sortNetworks(nonTestNetworks),
  );
  useEffect(
    () => setOrderedNetworks(sortNetworks(nonTestNetworks)),
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

  // If any network has multiple RPC endpoints, show multi-rpc selectors for all networks
  const showMultiRpcSelectors = [
    ...searchedEnabledNetworks,
    ...searchedTestNetworks,
  ].some((network) => network.rpcEndpoints.length > 1);

  // Renders a network in the network list
  const generateNetworkListItem = (network: NetworkConfiguration) => {
    const isCurrentNetwork = network.chainId === currentChainId;
    const canDeleteNetwork =
      isUnlocked && !isCurrentNetwork && network.chainId !== CHAIN_IDS.MAINNET;

    const allOpts: Record<string, boolean> = {};
    Object.keys(allNetworks).forEach((chainId) => {
      allOpts[chainId] = true;
    });

    return (
      <NetworkListItem
        name={network.name}
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
        key={network.chainId}
        chainId={network.chainId}
        selected={isCurrentNetwork && !focusSearch}
        focus={isCurrentNetwork && !focusSearch}
        onClick={() => {
          const { networkClientId } =
            network.rpcEndpoints[network.defaultRpcEndpointIndex];
          dispatch(setActiveNetwork(networkClientId));
          dispatch(toggleNetworkMenu());
          dispatch(updateCustomNonce(''));
          dispatch(setNextNonce(''));
          dispatch(detectNfts());

          // as a user, I don't want my network selection to force update my filter when I have "All Networks" toggled on
          // however, if I am already filtered on "Current Network", we'll want to filter by the selected network when the network changes
          if (Object.keys(tokenNetworkFilter || {}).length <= 1) {
            dispatch(setTokenNetworkFilter({ [network.chainId]: true }));
          } else if (process.env.PORTFOLIO_VIEW) {
            dispatch(setTokenNetworkFilter(allOpts));
          }

          if (permittedAccountAddresses.length > 0) {
            dispatch(addPermittedChain(selectedTabOrigin, network.chainId));
            if (!permittedChainIds.includes(network.chainId)) {
              dispatch(showPermittedNetworkToast());
            }
          }
          // If presently on a dapp, communicate a change to
          // the dapp via silent switchEthereumChain that the
          // network has changed due to user action
          if (selectedTabOrigin && domains[selectedTabOrigin]) {
            setNetworkClientIdForDomain(selectedTabOrigin, networkClientId);
          }

          trackEvent({
            event: MetaMetricsEventName.NavNetworkSwitched,
            category: MetaMetricsEventCategory.Network,
            properties: {
              location: 'Network Menu',
              chain_id: currentChainId,
              from_network: currentChainId,
              to_network: network.chainId,
            },
          });
        }}
        onDeleteClick={
          canDeleteNetwork
            ? () => {
                dispatch(toggleNetworkMenu());
                dispatch(
                  showModal({
                    name: 'CONFIRM_DELETE_NETWORK',
                    target: network.chainId,
                    onConfirm: () => undefined,
                  }),
                );
              }
            : undefined
        }
        onEditClick={() => {
          dispatch(
            setEditedNetwork({
              chainId: network.chainId,
              nickname: network.name,
            }),
          );
          setActionMode(ACTION_MODES.ADD_EDIT);
        }}
        onRpcEndpointClick={() => {
          setActionMode(ACTION_MODES.SELECT_RPC);
          dispatch(setEditedNetwork({ chainId: network.chainId }));
        }}
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
                                  {generateNetworkListItem(network)}
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
                    generateNetworkListItem(network),
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
