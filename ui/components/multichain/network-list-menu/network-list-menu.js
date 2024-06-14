import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import Fuse from 'fuse.js';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { NetworkListItem } from '../network-list-item';
import {
  hideNetworkBanner,
  setActiveNetwork,
  setProviderType,
  setShowTestNetworks,
  showModal,
  toggleNetworkMenu,
  updateNetworksList,
  setNetworkClientIdForDomain,
} from '../../../store/actions';
import {
  FEATURED_RPCS,
  TEST_CHAINS,
} from '../../../../shared/constants/network';
import {
  getCurrentChainId,
  getCurrentNetwork,
  getNonTestNetworks,
  getShowTestNetworks,
  getTestNetworks,
  getOrderedNetworksList,
  getOnboardedInThisUISession,
  getShowNetworkBanner,
  getOriginOfCurrentTab,
  getUseRequestQueue,
  getNetworkConfigurations,
} from '../../../selectors';
import ToggleButton from '../../ui/toggle-button';
import {
  AlignItems,
  BackgroundColor,
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
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
} from '../../component-library';
import { ADD_POPULAR_CUSTOM_NETWORK } from '../../../helpers/constants/routes';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_FULLSCREEN } from '../../../../shared/constants/app';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import {
  getCompletedOnboarding,
  getIsUnlocked,
} from '../../../ducks/metamask/metamask';
import { getLocalNetworkMenuRedesignFeatureFlag } from '../../../helpers/utils/feature-flags';
import AddNetworkModal from '../../../pages/onboarding-flow/add-network-modal';
import PopularNetworkList from './popular-network-list/popular-network-list';
import NetworkListSearch from './network-list-search/network-list-search';
import AddRpcUrlModal from './add-rpc-url-modal/add-rpc-url-modal';

const ACTION_MODES = {
  // Displays the search box and network list
  LIST: 'list',
  // Displays the Add form
  ADD: 'add',
  // Displays the Edit form
  EDIT: 'edit',
  //
  ADD_RPC: 'add_rpc',
};

export const NetworkListMenu = ({ onClose }) => {
  const t = useI18nContext();

  const [actionMode, setActionMode] = useState(ACTION_MODES.LIST);
  const [modalTitle, setModalTitle] = useState(t('networkMenuHeading'));
  const [networkToEdit, setNetworkToEdit] = useState(null);
  const nonTestNetworks = useSelector(getNonTestNetworks);
  const testNetworks = useSelector(getTestNetworks);
  const showTestNetworks = useSelector(getShowTestNetworks);
  const currentChainId = useSelector(getCurrentChainId);
  const networkMenuRedesign = useSelector(
    getLocalNetworkMenuRedesignFeatureFlag,
  );

  const selectedTabOrigin = useSelector(getOriginOfCurrentTab);
  const useRequestQueue = useSelector(getUseRequestQueue);
  const networkConfigurations = useSelector(getNetworkConfigurations);

  const dispatch = useDispatch();
  const history = useHistory();
  const trackEvent = useContext(MetaMetricsContext);

  const currentNetwork = useSelector(getCurrentNetwork);
  const currentlyOnTestNetwork = TEST_CHAINS.includes(currentChainId);

  const environmentType = getEnvironmentType();
  const isFullScreen = environmentType === ENVIRONMENT_TYPE_FULLSCREEN;

  const completedOnboarding = useSelector(getCompletedOnboarding);

  const isUnlocked = useSelector(getIsUnlocked);

  const orderedNetworksList = useSelector(getOrderedNetworksList);

  const networkConfigurationChainIds = Object.values(networkConfigurations).map(
    (net) => net.chainId,
  );

  const sortedFeaturedNetworks = FEATURED_RPCS.sort((a, b) =>
    a.nickname > b.nickname ? 1 : -1,
  ).slice(0, FEATURED_RPCS.length);

  const notExistingNetworkConfigurations = sortedFeaturedNetworks.filter(
    ({ chainId }) => !networkConfigurationChainIds.includes(chainId),
  );

  const newOrderNetworks = () => {
    if (!orderedNetworksList || orderedNetworksList.length === 0) {
      return nonTestNetworks;
    }

    // Create a mapping of chainId to index in orderedNetworksList
    const orderedIndexMap = {};
    orderedNetworksList.forEach((network, index) => {
      orderedIndexMap[`${network.networkId}_${network.networkRpcUrl}`] = index;
    });

    // Sort nonTestNetworks based on the order in orderedNetworksList
    const sortedNonTestNetworks = nonTestNetworks.sort((a, b) => {
      const keyA = `${a.chainId}_${a.rpcUrl}`;
      const keyB = `${b.chainId}_${b.rpcUrl}`;
      return orderedIndexMap[keyA] - orderedIndexMap[keyB];
    });

    return sortedNonTestNetworks;
  };

  const networksList = newOrderNetworks();
  const [items, setItems] = useState([...networksList]);

  useEffect(() => {
    if (currentlyOnTestNetwork) {
      dispatch(setShowTestNetworks(currentlyOnTestNetwork));
    }
  }, [dispatch, currentlyOnTestNetwork]);

  const [searchQuery, setSearchQuery] = useState('');
  const onboardedInThisUISession = useSelector(getOnboardedInThisUISession);
  const showNetworkBanner = useSelector(getShowNetworkBanner);
  const showBanner =
    completedOnboarding && !onboardedInThisUISession && showNetworkBanner;

  const onDragEnd = (result) => {
    if (!result.destination) {
      return;
    }

    const newItems = [...items];
    const [removed] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, removed);

    // Convert the updated array back to NetworksInfo format
    const orderedArray = newItems.map((obj) => ({
      networkId: obj.chainId, // Assuming chainId is the networkId
      networkRpcUrl: obj.rpcUrl,
    }));

    dispatch(updateNetworksList(orderedArray));

    setItems(newItems);
  };

  let searchResults =
    [...networksList].length === items.length ? items : [...networksList];

  let searchAddNetworkResults =
    [...notExistingNetworkConfigurations].length === items.length
      ? items
      : [...notExistingNetworkConfigurations];

  const isSearching = searchQuery !== '';

  if (isSearching) {
    const fuse = new Fuse(searchResults, {
      threshold: 0.2,
      location: 0,
      distance: 100,
      maxPatternLength: 32,
      minMatchCharLength: 1,
      shouldSort: true,
      keys: ['nickname', 'chainId', 'ticker'],
    });
    const fuseForPopularNetworks = new Fuse(searchAddNetworkResults, {
      threshold: 0.2,
      location: 0,
      distance: 100,
      maxPatternLength: 32,
      minMatchCharLength: 1,
      shouldSort: true,
      keys: ['nickname', 'chainId', 'ticker'],
    });

    fuse.setCollection(searchResults);
    fuseForPopularNetworks.setCollection(searchAddNetworkResults);
    const fuseResults = fuse.search(searchQuery);
    const fuseForPopularNetworksResults =
      fuseForPopularNetworks.search(searchQuery);

    searchResults = searchResults.filter((network) =>
      fuseResults.includes(network),
    );
    searchAddNetworkResults = searchAddNetworkResults.filter((network) =>
      fuseForPopularNetworksResults.includes(network),
    );
  }

  const getOnDeleteCallback = (networkId) => {
    return () => {
      dispatch(toggleNetworkMenu());
      dispatch(
        showModal({
          name: 'CONFIRM_DELETE_NETWORK',
          target: networkId,
          onConfirm: () => undefined,
        }),
      );
    };
  };

  const getOnEditCallback = (network) => {
    return () => {
      const networkToUse = {
        ...network,
        label: network.nickname,
      };
      setModalTitle(network.nickname);
      setNetworkToEdit(networkToUse);
      setActionMode(ACTION_MODES.EDIT);
    };
  };

  const generateMenuItems = (desiredNetworks) => {
    return desiredNetworks.map((network) => {
      const isCurrentNetwork =
        currentNetwork.id === network.id &&
        currentNetwork.rpcUrl === network.rpcUrl;

      const canDeleteNetwork =
        isUnlocked && !isCurrentNetwork && network.removable;

      return (
        <NetworkListItem
          name={network.nickname}
          iconSrc={network?.rpcPrefs?.imageUrl}
          key={network.id}
          selected={isCurrentNetwork}
          focus={isCurrentNetwork && !isSearching}
          onClick={() => {
            dispatch(toggleNetworkMenu());
            if (network.providerType) {
              dispatch(setProviderType(network.providerType));
            } else {
              dispatch(setActiveNetwork(network.id));
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
            canDeleteNetwork ? getOnDeleteCallback(network.id) : null
          }
          onEditClick={getOnEditCallback(network)}
        />
      );
    });
  };

  const handleToggle = (value) => {
    const shouldShowTestNetworks = !value;
    dispatch(setShowTestNetworks(shouldShowTestNetworks));
    if (shouldShowTestNetworks) {
      trackEvent({
        event: MetaMetricsEventName.TestNetworksDisplayed,
        category: MetaMetricsEventCategory.Network,
      });
    }
  };

  const renderListNetworks = () => {
    if (actionMode === ACTION_MODES.LIST) {
      return (
        <>
          <NetworkListSearch
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />

          <Box className="multichain-network-list-menu">
            {showBanner ? (
              <BannerBase
                className="network-list-menu__banner"
                marginLeft={4}
                marginRight={4}
                marginBottom={4}
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
            ) : null}
            <Box className="multichain-network-list-menu">
              {searchResults.length === 0 && isSearching ? (
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
                        {searchResults.map((network, index) => {
                          const isCurrentNetwork =
                            currentNetwork.id === network.id;

                          const canDeleteNetwork =
                            isUnlocked &&
                            !isCurrentNetwork &&
                            network.removable;

                          return (
                            <Draggable
                              key={network.id}
                              draggableId={network.id}
                              index={index}
                            >
                              {(providedDrag) => (
                                <Box
                                  ref={providedDrag.innerRef}
                                  {...providedDrag.draggableProps}
                                  {...providedDrag.dragHandleProps}
                                >
                                  <NetworkListItem
                                    name={network.nickname}
                                    iconSrc={network?.rpcPrefs?.imageUrl}
                                    key={network.id}
                                    selected={isCurrentNetwork}
                                    focus={isCurrentNetwork && !isSearching}
                                    onClick={() => {
                                      dispatch(toggleNetworkMenu());
                                      if (network.providerType) {
                                        dispatch(
                                          setProviderType(network.providerType),
                                        );
                                      } else {
                                        dispatch(setActiveNetwork(network.id));
                                      }

                                      // If presently on a dapp, communicate a change to
                                      // the dapp via silent switchEthereumChain that the
                                      // network has changed due to user action
                                      if (
                                        useRequestQueue &&
                                        selectedTabOrigin
                                      ) {
                                        setNetworkClientIdForDomain(
                                          selectedTabOrigin,
                                          network.id,
                                        );
                                      }

                                      trackEvent({
                                        event:
                                          MetaMetricsEventName.NavNetworkSwitched,
                                        category:
                                          MetaMetricsEventCategory.Network,
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
                                        ? getOnDeleteCallback(network.id)
                                        : null
                                    }
                                    onEditClick={getOnEditCallback(network)}
                                  />
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
              {networkMenuRedesign ? (
                <PopularNetworkList
                  searchAddNetworkResults={searchAddNetworkResults}
                  data-testid="add-popular-network-view"
                />
              ) : null}
              <Box
                padding={4}
                display={Display.Flex}
                justifyContent={JustifyContent.spaceBetween}
              >
                <Text>{t('showTestnetNetworks')}</Text>
                <ToggleButton
                  value={showTestNetworks}
                  disabled={currentlyOnTestNetwork}
                  onToggle={handleToggle}
                />
              </Box>
              {showTestNetworks || currentlyOnTestNetwork ? (
                <Box className="multichain-network-list-menu">
                  {generateMenuItems(testNetworks)}
                </Box>
              ) : null}
            </Box>
          </Box>

          <Box paddingLeft={4} paddingRight={4} paddingTop={4}>
            <ButtonSecondary
              size={ButtonSecondarySize.Lg}
              startIconName={IconName.Add}
              block
              onClick={() => {
                if (!networkMenuRedesign) {
                  if (isFullScreen) {
                    if (completedOnboarding) {
                      history.push(ADD_POPULAR_CUSTOM_NETWORK);
                    } else {
                      dispatch(showModal({ name: 'ONBOARDING_ADD_NETWORK' }));
                    }
                  } else {
                    global.platform.openExtensionInBrowser(
                      ADD_POPULAR_CUSTOM_NETWORK,
                    );
                  }
                  dispatch(toggleNetworkMenu());
                  return;
                }
                trackEvent({
                  event: MetaMetricsEventName.AddNetworkButtonClick,
                  category: MetaMetricsEventCategory.Network,
                });
                setActionMode(ACTION_MODES.ADD);
                setModalTitle(t('addCustomNetwork'));
              }}
            >
              {t('addNetwork')}
            </ButtonSecondary>
          </Box>
        </>
      );
    } else if (actionMode === ACTION_MODES.ADD) {
      return <AddNetworkModal isNewNetworkFlow addNewNetwork />;
    } else if (actionMode === ACTION_MODES.EDIT) {
      return (
        <AddNetworkModal
          isNewNetworkFlow
          addNewNetwork={false}
          networkToEdit={networkToEdit}
          onRpcUrlAdd={() => setActionMode(ACTION_MODES.ADD_RPC)}
        />
      );
    } else if (actionMode === ACTION_MODES.ADD_RPC) {
      return <AddRpcUrlModal />;
    }
  };

  const headerAdditionalProps =
    actionMode === ACTION_MODES.LIST
      ? {}
      : actionMode === ACTION_MODES.ADD_RPC
      ? { onBack: () => setActionMode(ACTION_MODES.EDIT) }
      : { onBack: () => setActionMode(ACTION_MODES.LIST) };

  return (
    <Modal isOpen onClose={onClose}>
      <ModalOverlay />
      <ModalContent
        className="multichain-network-list-menu-content-wrapper"
        modalDialogProps={{
          className: 'multichain-network-list-menu-content-wrapper__dialog',
          display: Display.Flex,
          flexDirection: FlexDirection.Column,
          padding: 0,
        }}
      >
        <ModalHeader
          paddingTop={4}
          paddingRight={4}
          paddingBottom={6}
          onClose={onClose}
          {...headerAdditionalProps}
        >
          {modalTitle}
        </ModalHeader>
        {renderListNetworks()}
      </ModalContent>
    </Modal>
  );
};

NetworkListMenu.propTypes = {
  /**
   * Executes when the menu should be closed
   */
  onClose: PropTypes.func.isRequired,
};
