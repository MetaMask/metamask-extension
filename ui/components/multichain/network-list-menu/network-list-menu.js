import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import Fuse from 'fuse.js';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { NetworkListItem } from '../network-list-item';
import {
  setActiveNetwork,
  setProviderType,
  setShowTestNetworks,
  showModal,
  toggleNetworkMenu,
  updateNetworksList,
} from '../../../store/actions';
import { CHAIN_IDS, TEST_CHAINS } from '../../../../shared/constants/network';
import {
  getCurrentChainId,
  getCurrentNetwork,
  getNonTestNetworks,
  getShowTestNetworks,
  getTestNetworks,
  getOrderedNetworksList,
} from '../../../selectors';
import ToggleButton from '../../ui/toggle-button';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  Display,
  FlexDirection,
  JustifyContent,
  Size,
  TextColor,
} from '../../../helpers/constants/design-system';
import {
  Box,
  ButtonSecondary,
  ButtonSecondarySize,
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  TextFieldSearch,
  BannerBase,
  Icon,
  IconName,
  IconSize,
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
  isLineaMainnetNetworkReleased,
} from '../../../ducks/metamask/metamask';

export const NetworkListMenu = ({ onClose }) => {
  const t = useI18nContext();

  const nonTestNetworks = useSelector(getNonTestNetworks);
  const testNetworks = useSelector(getTestNetworks);
  const showTestNetworks = useSelector(getShowTestNetworks);
  const currentChainId = useSelector(getCurrentChainId);

  const dispatch = useDispatch();
  const history = useHistory();
  const trackEvent = useContext(MetaMetricsContext);

  const currentNetwork = useSelector(getCurrentNetwork);
  const currentlyOnTestNetwork = TEST_CHAINS.includes(currentChainId);

  const environmentType = getEnvironmentType();
  const isFullScreen = environmentType === ENVIRONMENT_TYPE_FULLSCREEN;

  const completedOnboarding = useSelector(getCompletedOnboarding);

  const lineaMainnetReleased = useSelector(isLineaMainnetNetworkReleased);

  const isUnlocked = useSelector(getIsUnlocked);

  const showSearch = nonTestNetworks.length > 3;

  const orderedNetworksList = useSelector(getOrderedNetworksList);

  const newOrderNetworks = () => {
    if (orderedNetworksList.length === 0) {
      return nonTestNetworks;
    }

    // Reorder nonTestNetworks based on the order of chainIds in orderedNetworksList
    const sortedNetworkList = orderedNetworksList
      .map((chainId) =>
        nonTestNetworks.find((network) => network.chainId === chainId),
      )
      .filter(Boolean);

    return sortedNetworkList;
  };

  const networksList = newOrderNetworks();

  useEffect(() => {
    if (currentlyOnTestNetwork) {
      dispatch(setShowTestNetworks(currentlyOnTestNetwork));
    }
  }, [dispatch, currentlyOnTestNetwork]);
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState([...networksList]);
  const [showBanner, setShowBanner] = useState(true);

  const onBannerClose = () => {
    setShowBanner(false);
  };

  const onDragEnd = (result) => {
    const newItems = [...items];
    const [removed] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, removed);
    setItems(newItems);
    const orderedArray = newItems.map((obj) => obj.chainId);

    dispatch(updateNetworksList(orderedArray));
  };

  let searchResults = process.env.NETWORK_ACCOUNT_DND
    ? items
    : [...nonTestNetworks];
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
    fuse.setCollection(searchResults);
    const fuseResults = fuse.search(searchQuery);
    // Ensure order integrity with original list
    searchResults = searchResults.filter((network) =>
      fuseResults.includes(network),
    );
  }

  const generateMenuItems = (desiredNetworks) => {
    return desiredNetworks.map((network) => {
      if (!lineaMainnetReleased && network.providerType === 'linea-mainnet') {
        return null;
      }

      const isCurrentNetwork = currentNetwork.id === network.id;

      const canDeleteNetwork =
        isUnlocked && !isCurrentNetwork && network.removable;

      const isDeprecatedNetwork = network.chainId === CHAIN_IDS.AURORA;

      return (
        <NetworkListItem
          name={network.nickname}
          iconSrc={network?.rpcPrefs?.imageUrl}
          key={network.id}
          selected={isCurrentNetwork}
          focus={isCurrentNetwork && !showSearch}
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
          isDeprecatedNetwork={isDeprecatedNetwork}
          onDeleteClick={
            canDeleteNetwork
              ? () => {
                  dispatch(toggleNetworkMenu());
                  dispatch(
                    showModal({
                      name: 'CONFIRM_DELETE_NETWORK',
                      target: network.id,
                      onConfirm: () => undefined,
                    }),
                  );
                }
              : null
          }
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
        >
          {t('networkMenuHeading')}
        </ModalHeader>
        <>
          {showSearch ? (
            <Box
              paddingLeft={4}
              paddingRight={4}
              paddingBottom={4}
              paddingTop={0}
            >
              <TextFieldSearch
                size={Size.SM}
                width={BlockSize.Full}
                placeholder={t('search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                clearButtonOnClick={() => setSearchQuery('')}
                clearButtonProps={{
                  size: Size.SM,
                }}
                inputProps={{ autoFocus: true }}
              />
            </Box>
          ) : null}
          {process.env.NETWORK_ACCOUNT_DND && showBanner ? (
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
                  <Icon name={IconName.DragDrop} size={IconSize.Lg} />
                </Box>
              }
              onClose={() => onBannerClose()}
              description={t('DragAndDropBanner')}
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
              <>
                {process.env.NETWORK_ACCOUNT_DND ? (
                  <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="characters">
                      {(provided) => (
                        <Box
                          className="characters"
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                        >
                          {searchResults.map((network, index) => {
                            if (
                              !lineaMainnetReleased &&
                              network.providerType === 'linea-mainnet'
                            ) {
                              return null;
                            }

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
                                      focus={isCurrentNetwork && !showSearch}
                                      onClick={() => {
                                        dispatch(toggleNetworkMenu());
                                        if (network.providerType) {
                                          dispatch(
                                            setProviderType(
                                              network.providerType,
                                            ),
                                          );
                                        } else {
                                          dispatch(
                                            setActiveNetwork(network.id),
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
                                          ? () => {
                                              dispatch(toggleNetworkMenu());
                                              dispatch(
                                                showModal({
                                                  name: 'CONFIRM_DELETE_NETWORK',
                                                  target: network.id,
                                                  onConfirm: () => undefined,
                                                }),
                                              );
                                            }
                                          : null
                                      }
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
                ) : (
                  generateMenuItems(searchResults)
                )}
              </>
            )}
          </Box>
          <Box
            padding={4}
            display={Display.Flex}
            justifyContent={JustifyContent.spaceBetween}
          >
            <Text>{t('showTestnetNetworks')}</Text>
            <ToggleButton
              value={showTestNetworks}
              disabled={currentlyOnTestNetwork || !isUnlocked}
              onToggle={handleToggle}
            />
          </Box>
          {showTestNetworks || currentlyOnTestNetwork ? (
            <Box className="multichain-network-list-menu">
              {generateMenuItems(testNetworks)}
            </Box>
          ) : null}
          <Box padding={4}>
            <ButtonSecondary
              size={ButtonSecondarySize.Lg}
              disabled={!isUnlocked}
              block
              onClick={() => {
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
                trackEvent({
                  event: MetaMetricsEventName.AddNetworkButtonClick,
                  category: MetaMetricsEventCategory.Network,
                });
              }}
            >
              {t('addNetwork')}
            </ButtonSecondary>
          </Box>
        </>
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
