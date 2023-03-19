import React from 'react';
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
} from '../../../store/actions';
import { CHAIN_IDS, TEST_CHAINS } from '../../../../shared/constants/network';
import {
  getShowTestNetworks,
  getAllNetworks,
  getCurrentChainId,
} from '../../../selectors';
import Box from '../../ui/box/box';
import ToggleButton from '../../ui/toggle-button';
import {
  DISPLAY,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import { Button, BUTTON_TYPES, Text } from '../../component-library';
import { ADD_POPULAR_CUSTOM_NETWORK } from '../../../helpers/constants/routes';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_FULLSCREEN } from '../../../../shared/constants/app';

const UNREMOVABLE_CHAIN_IDS = [CHAIN_IDS.MAINNET, ...TEST_CHAINS];

export const NetworkListMenu = ({ closeMenu }) => {
  const t = useI18nContext();
  const networks = useSelector(getAllNetworks);
  const showTestNetworks = useSelector(getShowTestNetworks);
  const currentChainId = useSelector(getCurrentChainId);
  const dispatch = useDispatch();
  const history = useHistory();

  const environmentType = getEnvironmentType();
  const isFullScreen = environmentType === ENVIRONMENT_TYPE_FULLSCREEN;

  return (
    <Popover onClose={closeMenu} centerTitle title={t('networkMenuHeading')}>
      <Box>
        <Box style={{ maxHeight: '200px', overflow: 'auto' }}>
          {networks.map((network) => {
            const isCurrentNetwork = currentChainId === network.chainId;
            const canDeleteNetwork =
              !isCurrentNetwork &&
              !UNREMOVABLE_CHAIN_IDS.includes(network.chainId);

            return (
              <NetworkListItem
                name={
                  network.nicknameLocaleKey
                    ? t(network.nicknameLocaleKey)
                    : network.nickname
                }
                key={network.id || network.chainId}
                selected={isCurrentNetwork}
                onClick={() => {
                  if (network.providerType) {
                    dispatch(setProviderType(network.providerType));
                  } else {
                    dispatch(setActiveNetwork(network.id));
                  }
                  closeMenu();
                }}
                onDeleteClick={
                  canDeleteNetwork
                    ? () => {
                        dispatch(
                          showModal({
                            name: 'CONFIRM_DELETE_NETWORK',
                            target: network.id || network.chainId,
                            onConfirm: () => undefined,
                          }),
                        );
                        closeMenu();
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
            onToggle={(value) => setShowTestNetworks(!value)}
          />
        </Box>
        <Box padding={4}>
          <Button
            type={BUTTON_TYPES.SECONDARY}
            block
            onClick={() => {
              isFullScreen
                ? history.push(ADD_POPULAR_CUSTOM_NETWORK)
                : global.platform.openExtensionInBrowser(
                    ADD_POPULAR_CUSTOM_NETWORK,
                  );
            }}
          >
            {t('addNetwork')}
          </Button>
        </Box>
      </Box>
    </Popover>
  );
};

NetworkListMenu.propTypes = {
  closeMenu: PropTypes.func.isRequired,
};
