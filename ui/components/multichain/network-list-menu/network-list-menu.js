import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { NetworkListItem } from '../network-list-item';
import {
  setActiveNetwork,
  showModal,
  setShowTestNetworks,
  setProviderType,
  toggleNetworkMenu,
} from '../../../store/actions';
import { CHAIN_IDS, TEST_CHAINS } from '../../../../shared/constants/network';
import {
  getShowTestNetworks,
  getCurrentChainId,
  getNonTestNetworks,
  getTestNetworks,
} from '../../../selectors';
import ToggleButton from '../../ui/toggle-button';
import {
  Display,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import {
  BUTTON_SECONDARY_SIZES,
  ButtonSecondary,
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  Box,
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

const UNREMOVABLE_CHAIN_IDS = [
  CHAIN_IDS.MAINNET,
  CHAIN_IDS.LINEA_MAINNET,
  ...TEST_CHAINS,
];

export const NetworkListMenu = ({ onClose }) => {
  const t = useI18nContext();

  const nonTestNetworks = useSelector(getNonTestNetworks);
  const testNetworks = useSelector(getTestNetworks);
  const showTestNetworks = useSelector(getShowTestNetworks);
  const currentChainId = useSelector(getCurrentChainId);

  const dispatch = useDispatch();
  const history = useHistory();
  const trackEvent = useContext(MetaMetricsContext);

  const currentlyOnTestNetwork = TEST_CHAINS.includes(currentChainId);

  const environmentType = getEnvironmentType();
  const isFullScreen = environmentType === ENVIRONMENT_TYPE_FULLSCREEN;

  const completedOnboarding = useSelector(getCompletedOnboarding);

  const lineaMainnetReleased = useSelector(isLineaMainnetNetworkReleased);

  const generateMenuItems = (desiredNetworks) => {
    return desiredNetworks.map((network, index) => {
      if (!lineaMainnetReleased && network.providerType === 'linea-mainnet') {
        return null;
      }

      const isCurrentNetwork = currentChainId === network.chainId;
      const canDeleteNetwork =
        !isCurrentNetwork && !UNREMOVABLE_CHAIN_IDS.includes(network.chainId);

      return (
        <NetworkListItem
          name={network.nickname}
          iconSrc={network?.rpcPrefs?.imageUrl}
          key={`${network.id || network.chainId}-${index}`}
          selected={isCurrentNetwork}
          onClick={async () => {
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
                to_network: network.id || network.chainId,
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
                      target: network.id || network.chainId,
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
          <Box className="multichain-network-list-menu">
            {generateMenuItems(nonTestNetworks)}
          </Box>
          <Box
            padding={4}
            display={Display.Flex}
            justifyContent={JustifyContent.spaceBetween}
          >
            <Text>{t('showTestnetNetworks')}</Text>
            <ToggleButton
              value={showTestNetworks}
              disabled={currentlyOnTestNetwork}
              onToggle={(value) => {
                const shouldShowTestNetworks = !value;
                dispatch(setShowTestNetworks(shouldShowTestNetworks));
                if (shouldShowTestNetworks) {
                  trackEvent({
                    event: MetaMetricsEventName.TestNetworksDisplayed,
                    category: MetaMetricsEventCategory.Network,
                  });
                }
              }}
            />
          </Box>
          {showTestNetworks || currentlyOnTestNetwork ? (
            <Box className="multichain-network-list-menu">
              {generateMenuItems(testNetworks)}
            </Box>
          ) : null}
          <Box padding={4}>
            <ButtonSecondary
              size={BUTTON_SECONDARY_SIZES.LG}
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
