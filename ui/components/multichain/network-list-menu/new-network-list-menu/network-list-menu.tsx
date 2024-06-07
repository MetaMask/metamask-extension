import React, { useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import Fuse from 'fuse.js';
import { DropResult } from 'react-beautiful-dnd';
import {
  getCurrentChainId,
  getCurrentNetwork,
  getNonTestNetworks,
  getShowTestNetworks,
  getTestNetworks,
  getOrderedNetworksList,
  getShowNetworkBanner,
  getOriginOfCurrentTab,
  getUseRequestQueue,
  getNetworkConfigurations,
} from '../../../../selectors';
import {
  setShowTestNetworks,
  updateNetworksList,
} from '../../../../store/actions';
import {
  FEATURED_RPCS,
  TEST_CHAINS,
} from '../../../../../shared/constants/network';
import {
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_POPUP,
} from '../../../../../shared/constants/app';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import { DEFAULT_ROUTE } from '../../../../helpers/constants/routes';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import {
  Box,
  Modal,
  ModalBody,
  ModalContent,
  ModalContentSize,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '../../../component-library';
import { getEnvironmentType } from '../../../../../app/scripts/lib/util';
import { BackgroundColor } from '../../../../helpers/constants/design-system';
import { getIsUnlocked } from '../../../../ducks/metamask/metamask';
import NetworkListHeader from './network-list-header/network-list-header';
import NetworkListSearch from './network-list-search/network-list-search';
import NetworkListBanner from './network-list-banner/network-list-banner';
import NetworkListItems from './network-list-items/network-list-items';
import NetworkListFooter from './network-list-footer/network-list-footer';
import PopularNetworkList from './popular-network-list/popular-network-list';
import TestNetworksToggle from './test-network-toggle/test-network-toggle';

export const NetworkListMenu2 = ({ onClose }: { onClose: () => void }) => {
  const dispatch = useDispatch();
  const history = useHistory();
  const trackEvent = useContext(MetaMetricsContext);

  const nonTestNetworks = useSelector(getNonTestNetworks);
  const testNetworks = useSelector(getTestNetworks);
  const showTestNetworks = useSelector(getShowTestNetworks);
  const currentChainId = useSelector(getCurrentChainId);
  const currentNetwork = useSelector(getCurrentNetwork);
  const useRequestQueue = useSelector(getUseRequestQueue);
  const selectedTabOrigin = useSelector(getOriginOfCurrentTab);
  const orderedNetworksList = useSelector(getOrderedNetworksList);
  const networkConfigurations = useSelector(getNetworkConfigurations);
  const isUnlocked = useSelector(getIsUnlocked);
  const showNetworkBanner = useSelector(getShowNetworkBanner);

  const currentlyOnTestNetwork = TEST_CHAINS.includes(currentChainId);
  const showSearch = nonTestNetworks.length > 3;

  const networkConfigurationChainIds = Object.values(networkConfigurations).map(
    (net) => net.chainId,
  );

  const nets = FEATURED_RPCS.sort((a, b) =>
    a.nickname > b.nickname ? 1 : -1,
  ).slice(0, FEATURED_RPCS.length);

  const notExistingNetworkConfigurations = nets.filter(
    (net) => networkConfigurationChainIds.indexOf(net.chainId) === -1,
  );

  const isPopUp = getEnvironmentType() === ENVIRONMENT_TYPE_POPUP;
  const isFullScreen = getEnvironmentType() === ENVIRONMENT_TYPE_FULLSCREEN;

  const newOrderNetworks = () => {
    if (!orderedNetworksList || orderedNetworksList.length === 0) {
      return nonTestNetworks;
    }

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

    return nonTestNetworks.sort((a, b) => {
      const keyA = `${a.chainId}_${a.rpcUrl}`;
      const keyB = `${b.chainId}_${b.rpcUrl}`;
      return orderedIndexMap[keyA] - orderedIndexMap[keyB];
    });
  };

  const networksList = newOrderNetworks();
  const [items, setItems] = useState([...networksList]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (currentlyOnTestNetwork) {
      dispatch(setShowTestNetworks(currentlyOnTestNetwork));
    }
  }, [dispatch, currentlyOnTestNetwork]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const newItems = [...items];
    const [removed] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, removed);

    const orderedArray = newItems.map((obj) => ({
      networkId: obj.chainId,
      networkRpcUrl: obj.rpcUrl,
    })) as [];

    dispatch(updateNetworksList(orderedArray));
    setItems(newItems);
  };

  const redirectToDefaultRoute = async () => {
    history.push({
      pathname: DEFAULT_ROUTE,
    });
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

  const renderNetworkManagement = () => {
    if (isPopUp) {
      return (
        <Box
          className="new-network-list-menu-content-wrapper__network"
          backgroundColor={BackgroundColor.backgroundDefault}
        >
          <NetworkListHeader isModal={false} onClose={redirectToDefaultRoute} />
          <NetworkListSearch
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
          <NetworkListBanner showBanner={showNetworkBanner} />
          <NetworkListItems
            items={searchResults}
            onDragEnd={onDragEnd}
            currentNetwork={currentNetwork}
            dispatch={dispatch}
            trackEvent={trackEvent}
            currentChainId={currentChainId}
            showSearch={showSearch}
            useRequestQueue={useRequestQueue}
            selectedTabOrigin={selectedTabOrigin}
            isFullScreen={isFullScreen}
            onClose={onClose}
            isUnlocked={isUnlocked}
          />
          <PopularNetworkList
            searchAddNetworkResults={searchAddNetworkResults}
            onClose={onClose}
            isFullScreen={isFullScreen}
          />
          <TestNetworksToggle
            showTestNetworks={showTestNetworks}
            currentlyOnTestNetwork={currentlyOnTestNetwork}
            handleToggle={handleToggle}
            testNetworks={testNetworks}
          />
          <NetworkListFooter isPopUp={isPopUp} />
        </Box>
      );
    }
    return (
      <Modal isOpen onClose={onClose}>
        <ModalOverlay />
        <ModalContent size={ModalContentSize.Md}>
          <ModalHeader>
            <NetworkListHeader isModal={true} onClose={onClose} />
          </ModalHeader>
          <ModalBody>
            <NetworkListSearch
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
            <NetworkListBanner showBanner={showNetworkBanner} />
            <NetworkListItems
              items={searchResults}
              onDragEnd={onDragEnd}
              currentNetwork={currentNetwork}
              dispatch={dispatch}
              trackEvent={trackEvent}
              currentChainId={currentChainId}
              showSearch={showSearch}
              useRequestQueue={useRequestQueue}
              selectedTabOrigin={selectedTabOrigin}
              isFullScreen={isFullScreen}
              onClose={onClose}
              isUnlocked={isUnlocked}
            />
            <PopularNetworkList
              searchAddNetworkResults={searchAddNetworkResults}
              onClose={onClose}
              isFullScreen={isFullScreen}
            />
            <TestNetworksToggle
              showTestNetworks={showTestNetworks}
              currentlyOnTestNetwork={currentlyOnTestNetwork}
              handleToggle={handleToggle}
              testNetworks={testNetworks}
            />
          </ModalBody>
          <ModalFooter>
            <NetworkListFooter isPopUp={isPopUp} />
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  };

  return renderNetworkManagement();
};
