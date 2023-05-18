import React, { useContext, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { useI18nContext } from '../../../hooks/useI18nContext';
import Popover from '../../ui/popover/popover.component';
import { NetworkListItem } from '../network-list-item';
import {
  setActiveNetwork,
  showModal,
  setShowTestNetworks,
  setProviderType,
  toggleNetworkMenu,
  upsertNetworkConfiguration,
} from '../../../store/actions';
import { CHAIN_IDS, TEST_CHAINS } from '../../../../shared/constants/network';
import {
  getShowTestNetworks,
  getAllEnabledNetworks,
  getCurrentChainId,
  getNetworkConfigurations,
} from '../../../selectors';
import Box from '../../ui/box/box';
import ToggleButton from '../../ui/toggle-button';
import {
  DISPLAY,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import {
  BUTTON_SECONDARY_SIZES,
  ButtonSecondary,
  Text,
} from '../../component-library';
import { ADD_POPULAR_CUSTOM_NETWORK } from '../../../helpers/constants/routes';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_FULLSCREEN } from '../../../../shared/constants/app';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsNetworkEventSource,
} from '../../../../shared/constants/metametrics';

const UNREMOVABLE_CHAIN_IDS = [CHAIN_IDS.MAINNET, ...TEST_CHAINS];

export const NetworkListMenu = ({ onClose }) => {
  const t = useI18nContext();
  const networks = useSelector(getAllEnabledNetworks);
  const showTestNetworks = useSelector(getShowTestNetworks);
  const networkConfigurations = useSelector(getNetworkConfigurations);
  const currentChainId = useSelector(getCurrentChainId);
  const dispatch = useDispatch();
  const history = useHistory();
  const trackEvent = useContext(MetaMetricsContext);

  const environmentType = getEnvironmentType();
  const isFullScreen = environmentType === ENVIRONMENT_TYPE_FULLSCREEN;

  const showTestNetworksRef = useRef(showTestNetworks);
  const networkListRef = useRef(null);

  useEffect(() => {
    if (showTestNetworks && !showTestNetworksRef.current) {
      // Scroll to the bottom of the list
      networkListRef.current.lastChild.scrollIntoView();
    }
    showTestNetworksRef.current = showTestNetworks;
  }, [showTestNetworks, showTestNetworksRef]);

  return (
    <Popover
      contentClassName="multichain-network-list-menu-content-wrapper"
      onClose={onClose}
      centerTitle
      title={t('networkMenuHeading')}
    >
      <>
        <Box className="multichain-network-list-menu" ref={networkListRef}>
          {networks.map((network, index) => {
            const isCurrentNetwork = currentChainId === network.chainId;
            const canDeleteNetwork =
              !isCurrentNetwork &&
              !UNREMOVABLE_CHAIN_IDS.includes(network.chainId);

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
                    // Linea needs to be added as a custom network because
                    // it is not yet supported by Infura.  The following lazily
                    // adds Linea to the custom network configurations object
                    let networkId = network.id;
                    if (network.chainId === CHAIN_IDS.LINEA_TESTNET) {
                      const lineaNetworkConfiguration = Object.values(
                        networkConfigurations,
                      ).find(
                        ({ chainId }) => chainId === CHAIN_IDS.LINEA_TESTNET,
                      );
                      if (lineaNetworkConfiguration) {
                        networkId = lineaNetworkConfiguration.id;
                      } else {
                        networkId = await dispatch(
                          upsertNetworkConfiguration(network, {
                            setActive: true,
                            source:
                              MetaMetricsNetworkEventSource.CustomNetworkForm,
                          }),
                        );
                      }
                    }
                    dispatch(setActiveNetwork(networkId));
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
          })}
        </Box>
        <Box
          padding={4}
          display={DISPLAY.FLEX}
          justifyContent={JustifyContent.spaceBetween}
        >
          <Text>{t('showTestnetNetworks')}</Text>
          <ToggleButton
            value={showTestNetworks}
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
        <Box padding={4}>
          <ButtonSecondary
            size={BUTTON_SECONDARY_SIZES.LG}
            block
            onClick={() => {
              isFullScreen
                ? history.push(ADD_POPULAR_CUSTOM_NETWORK)
                : global.platform.openExtensionInBrowser(
                    ADD_POPULAR_CUSTOM_NETWORK,
                  );
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
    </Popover>
  );
};

NetworkListMenu.propTypes = {
  /**
   * Executes when the menu should be closed
   */
  onClose: PropTypes.func.isRequired,
};
