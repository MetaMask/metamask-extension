import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import Fuse from 'fuse.js';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { NetworkListItem } from '../network-list-item';
import {
  setActiveNetwork,
  showModal,
  setShowTestNetworks,
  setProviderType,
  toggleNetworkMenu,
} from '../../../store/actions';
import { TEST_CHAINS } from '../../../../shared/constants/network';
import {
  getShowTestNetworks,
  getCurrentChainId,
  getNonTestNetworks,
  getTestNetworks,
  getCurrentNetwork,
} from '../../../selectors';
import ToggleButton from '../../ui/toggle-button';
import {
  BlockSize,
  Display,
  JustifyContent,
  Size,
  TextColor,
} from '../../../helpers/constants/design-system';
import {
  ButtonSecondarySize,
  ButtonSecondary,
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Box,
  Text,
  TextFieldSearch,
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

  const isUnlocked = useSelector((state) => state.metamask.isUnlocked);

  const showSearch = nonTestNetworks.length > 3;

  useEffect(() => {
    if (currentlyOnTestNetwork) {
      dispatch(setShowTestNetworks(currentlyOnTestNetwork));
    }
  }, [dispatch, currentlyOnTestNetwork]);
  const [searchQuery, setSearchQuery] = useState('');

  let searchResults = [...nonTestNetworks];
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
        modalDialogProps={{ padding: 0 }}
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
              generateMenuItems(searchResults)
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
