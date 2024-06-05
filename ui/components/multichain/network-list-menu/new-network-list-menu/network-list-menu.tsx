import React, { useContext, useEffect, useState } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from 'react-beautiful-dnd';
import { useDispatch, useSelector } from 'react-redux';
import Fuse from 'fuse.js';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { NetworkListItem } from '../../network-list-item';
import {
  hideNetworkBanner,
  setActiveNetwork,
  setProviderType,
  setShowTestNetworks,
  showModal,
  toggleNetworkMenu,
  updateNetworksList,
  setNetworkClientIdForDomain,
  requestUserApproval,
} from '../../../../store/actions';
import {
  CHAIN_IDS,
  FEATURED_RPCS,
  NetworkType,
  TEST_CHAINS,
} from '../../../../../shared/constants/network';
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
  getUnapprovedConfirmations,
} from '../../../../selectors';
import ToggleButton from '../../../ui/toggle-button';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderRadius,
  Display,
  FlexDirection,
  JustifyContent,
  Size,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import {
  Box,
  Text,
  BannerBase,
  AvatarNetwork,
  AvatarNetworkSize,
  Button,
  ButtonVariant,
  ButtonSecondary,
  ButtonSecondarySize,
  IconName,
} from '../../../component-library';
import { TextFieldSearch } from '../../../component-library/text-field-search/deprecated';
import { getEnvironmentType } from '../../../../../app/scripts/lib/util';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsNetworkEventSource,
} from '../../../../../shared/constants/metametrics';
import {
  getCompletedOnboarding,
  getIsUnlocked,
} from '../../../../ducks/metamask/metamask';
import {
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_POPUP,
  ORIGIN_METAMASK,
} from '../../../../../shared/constants/app';
import { useHistory } from 'react-router-dom';
import { ApprovalType } from '@metamask/controller-utils';
import Popover from '../../../ui/popover';
import ConfirmationPage from '../../../../pages/confirmations/confirmation/confirmation';
import ScrollToBottom from '../../../../pages/confirmations/components/confirm/scroll-to-bottom';
import { PageContainerFooter } from '../../../ui/page-container';
import NetworksFormSubheader from '../../../../pages/settings/networks-tab/networks-tab-subheader/networks-tab-subheader';

export const NetworkListMenu2 = () => {
  const t = useI18nContext();

  const nonTestNetworks = useSelector(getNonTestNetworks);
  const testNetworks = useSelector(getTestNetworks);
  const showTestNetworks = useSelector(getShowTestNetworks);
  const currentChainId = useSelector(getCurrentChainId);

  const selectedTabOrigin = useSelector(getOriginOfCurrentTab);
  const useRequestQueue = useSelector(getUseRequestQueue);

  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);

  const currentNetwork = useSelector(getCurrentNetwork);
  const currentlyOnTestNetwork = TEST_CHAINS.includes(currentChainId);

  const completedOnboarding = useSelector(getCompletedOnboarding);

  const isUnlocked = useSelector(getIsUnlocked);

  const showSearch = nonTestNetworks.length > 3;

  const orderedNetworksList = useSelector(getOrderedNetworksList);

  const networkConfigurations = useSelector(getNetworkConfigurations);

  const { platform } = global;

  const history = useHistory();

  const networkConfigurationChainIds = Object.values(networkConfigurations).map(
    (net) => net.chainId,
  );

  const nets = FEATURED_RPCS.sort((a, b) =>
    a.nickname > b.nickname ? 1 : -1,
  ).slice(0, FEATURED_RPCS.length);

  const notExistingNetworkConfigurations = nets.filter(
    (net) => networkConfigurationChainIds.indexOf(net.chainId) === -1,
  );

  const unapprovedConfirmations = useSelector(getUnapprovedConfirmations);

  const newOrderNetworks = () => {
    if (!orderedNetworksList || orderedNetworksList.length === 0) {
      return nonTestNetworks;
    }

    // Create a mapping of chainId to index in orderedNetworksList
    const orderedIndexMap: Record<string, number> = {};
    orderedNetworksList.forEach(
      (
        network: { networkId: string; networkRpcUrl: string },
        index: number,
      ) => {
        orderedIndexMap[`${network.networkId}_${network.networkRpcUrl}`] =
          index;
      },
    );

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
  const [showPopover, setShowPopover] = useState(false);

  useEffect(() => {
    if (currentlyOnTestNetwork) {
      dispatch(setShowTestNetworks(currentlyOnTestNetwork));
    }
  }, [dispatch, currentlyOnTestNetwork]);

  useEffect(() => {
    const anAddNetworkConfirmationFromMetaMaskExists =
      unapprovedConfirmations?.find((confirmation) => {
        return (
          confirmation.origin === 'metamask' &&
          confirmation.type === ApprovalType.AddEthereumChain
        );
      });
    if (!showPopover && anAddNetworkConfirmationFromMetaMaskExists) {
      setShowPopover(true);
    }

    if (showPopover && !anAddNetworkConfirmationFromMetaMaskExists) {
      setShowPopover(false);
    }
  }, [unapprovedConfirmations, showPopover]);

  const [searchQuery, setSearchQuery] = useState('');
  const onboardedInThisUISession = useSelector(getOnboardedInThisUISession);
  const showNetworkBanner = useSelector(getShowNetworkBanner);
  const showBanner =
    completedOnboarding && !onboardedInThisUISession && showNetworkBanner;

  const onDragEnd = (result: DropResult) => {
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
    })) as [];

    dispatch(updateNetworksList(orderedArray));

    setItems(newItems);
  };

  let searchResults =
    [...networksList].length === items.length ? items : [...networksList];
  const isSearching = searchQuery !== '';

  let searchAddNetworkResults =
    [...notExistingNetworkConfigurations].length === items.length
      ? items
      : [...notExistingNetworkConfigurations];

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

    console.log('IM IN RESEARCH ------------', searchAddNetworkResults);
    console.log('searchQuery ------------', searchAddNetworkResults);

    fuse.setCollection(searchResults);
    fuseForPopularNetworks.setCollection(searchAddNetworkResults);
    const fuseResults = fuse.search(searchQuery);
    const fuseForPopularNetworksResults =
      fuseForPopularNetworks.search(searchQuery);

    console.log(
      'fuseForPopularNetworksResults ------------',
      fuseForPopularNetworksResults,
    );

    // Ensure order integrity with original list
    searchResults = searchResults.filter((network) =>
      fuseResults.includes(network),
    );
    searchAddNetworkResults = searchAddNetworkResults.filter((network) =>
      fuseForPopularNetworksResults.includes(network),
    );
  }

  const generateMenuItems = (
    desiredNetworks: {
      id: string;
      rpcUrl: string;
      removable: boolean;
      chainId: string;
      nickname: string;
      rpcPrefs: {
        imageUrl: string;
      };
      providerType: NetworkType;
    }[],
  ) => {
    return desiredNetworks.map((network) => {
      const isCurrentNetwork =
        currentNetwork.id === network.id &&
        currentNetwork.rpcUrl === network.rpcUrl;

      const canDeleteNetwork =
        isUnlocked && !isCurrentNetwork && network.removable;

      const isDeprecatedNetwork = network.chainId === CHAIN_IDS.AURORA;

      return (
        <NetworkListItem
          name={network.nickname}
          iconSrc={network?.rpcPrefs?.imageUrl}
          key={network.id}
          selected={isCurrentNetwork}
          focus={isCurrentNetwork}
          onClick={() => {
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

  const handleToggle = (value: boolean) => {
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
    <Box
      className="new-network-list-menu-content-wrapper__network"
      backgroundColor={BackgroundColor.backgroundDefault}
    >
      {getEnvironmentType() === ENVIRONMENT_TYPE_FULLSCREEN ? (
        <Box padding={4}>
          <NetworksFormSubheader addNewNetwork={false} />
        </Box>
      ) : null}

      <Box paddingLeft={4} paddingRight={4} paddingBottom={4} paddingTop={0}>
        <TextFieldSearch
          size={Size.LG}
          width={BlockSize.Full}
          placeholder={t('search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          clearButtonOnClick={() => setSearchQuery('')}
          clearButtonProps={{
            size: Size.SM,
          }}
          inputProps={{ autoFocus: true }}
          className={undefined}
          endAccessory={undefined}
        />
      </Box>
      {/* ------ end of search content -------- */}
      {/* ------- banner content --------- */}

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
              <img src="./images/dragging-animation.svg" alt="drag-and-drop" />
            </Box>
          }
          onClose={() => hideNetworkBanner()}
          description={t('dragAndDropBanner')}
        />
      ) : null}
      {/* ------- end of banner content --------- */}

      <Box className="new-network-list-menu">
        <Box
          padding={4}
          display={Display.Flex}
          justifyContent={JustifyContent.spaceBetween}
        >
          <Text>{t('enabledNetworks')}</Text>
        </Box>
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
                    const isCurrentNetwork = currentNetwork.id === network.id;

                    const canDeleteNetwork =
                      isUnlocked && !isCurrentNetwork && network.removable;

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
                                if (useRequestQueue && selectedTabOrigin) {
                                  setNetworkClientIdForDomain(
                                    selectedTabOrigin,
                                    network.id,
                                  );
                                }

                                trackEvent({
                                  event:
                                    MetaMetricsEventName.NavNetworkSwitched,
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
        )}

        {Object.keys(searchAddNetworkResults).length === 0 ? (
          <Box
            className="add-network__edge-case-box"
            borderRadius={BorderRadius.MD}
            padding={4}
            marginTop={4}
            marginRight={6}
            marginLeft={6}
            display={Display.Flex}
            flexDirection={FlexDirection.Row}
            backgroundColor={BackgroundColor.backgroundAlternative}
          >
            <Box marginRight={4}>
              <img src="images/info-fox.svg" />
            </Box>
            <Box>
              <Text variant={TextVariant.bodySm} as="h6">
                {t('youHaveAddedAll', [
                  <a
                    key="link"
                    className="add-network__edge-case-box__link"
                    href="https://chainlist.wtf/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('here')}.
                  </a>,
                  <Button
                    key="button"
                    type="inline"
                    // onClick={(event) => {
                    //   event.preventDefault();
                    //   getEnvironmentType() === ENVIRONMENT_TYPE_POPUP
                    //     ? platform.openExtensionInBrowser(ADD_NETWORK_ROUTE)
                    //     : history.push(ADD_NETWORK_ROUTE);
                    // }}
                  >
                    <Text
                      variant={TextVariant.bodySm}
                      as="h6"
                      color={TextColor.infoDefault}
                    >
                      {t('addMoreNetworks')}.
                    </Text>
                  </Button>,
                ])}
              </Text>
            </Box>
          </Box>
        ) : (
          <Box className="add-network__networks-container">
            <Box
              marginTop={
                getEnvironmentType() === ENVIRONMENT_TYPE_POPUP ? 0 : 4
              }
              marginBottom={1}
              className="add-network__main-container"
            >
              <Box
                paddingBottom={4}
                paddingTop={4}
                display={Display.Flex}
                justifyContent={JustifyContent.spaceBetween}
              >
                <Text> {t('additionalNetworks')}</Text>
              </Box>
              {searchAddNetworkResults.map((item, index) => (
                <Box
                  key={index}
                  display={Display.Flex}
                  alignItems={AlignItems.center}
                  justifyContent={JustifyContent.spaceBetween}
                  marginBottom={6}
                  className="add-network__list-of-networks"
                >
                  <Box display={Display.Flex} alignItems={AlignItems.center}>
                    <AvatarNetwork
                      size={AvatarNetworkSize.Sm}
                      src={item.rpcPrefs?.imageUrl}
                      name={item.nickname}
                    />
                    <Box marginLeft={2}>
                      <Text
                        variant={TextVariant.bodySmBold}
                        as="h6"
                        color={TextColor.textDefault}
                      >
                        {item.nickname}
                      </Text>
                    </Box>
                  </Box>
                  <Box
                    display={Display.Flex}
                    alignItems={AlignItems.center}
                    marginLeft={1}
                  >
                    <Button
                      type="inline"
                      className="add-network__add-button"
                      variant={ButtonVariant.Link}
                      onClick={async () => {
                        await dispatch(
                          requestUserApproval({
                            origin: ORIGIN_METAMASK,
                            type: ApprovalType.AddEthereumChain,
                            requestData: {
                              chainId: item.chainId,
                              rpcUrl: item.rpcUrl,
                              ticker: item.ticker,
                              rpcPrefs: item.rpcPrefs,
                              imageUrl: item.rpcPrefs?.imageUrl,
                              chainName: item.nickname,
                              referrer: ORIGIN_METAMASK,
                              source:
                                MetaMetricsNetworkEventSource.NewAddNetworkFlow,
                            },
                          }),
                        );
                      }}
                    >
                      {t('add')}
                    </Button>
                  </Box>
                </Box>
              ))}
            </Box>
            <Box
              padding={
                getEnvironmentType() === ENVIRONMENT_TYPE_POPUP
                  ? [2, 0, 2, 6]
                  : [2, 0, 2, 0]
              }
              className="add-network__footer"
            ></Box>
            {showPopover && (
              <Popover>
                <ConfirmationPage redirectToHomeOnZeroConfirmations={false} />
              </Popover>
            )}
          </Box>
        )}
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
          <Box className="new-network-list-menu">
            {generateMenuItems(testNetworks)}
          </Box>
        ) : null}
      </Box>
    </Box>
  );
};
