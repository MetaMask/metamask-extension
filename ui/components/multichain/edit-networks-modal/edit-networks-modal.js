import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import {
  AlignItems,
  Display,
  FlexDirection,
  IconColor,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getOriginOfCurrentTab,
  getPermittedChainsForSelectedTab,
  getTestNetworks,
} from '../../../selectors';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  Checkbox,
  Text,
  Box,
  ModalFooter,
  ButtonPrimary,
  ButtonPrimarySize,
  ModalBody,
  Icon,
  IconName,
  IconSize,
} from '../../component-library';
import { NetworkListItem } from '..';
import {
  grantPermittedChains,
  removePermittedChain,
} from '../../../store/actions';
import { getURLHost } from '../../../helpers/utils/util';

export const EditNetworksModal = ({
  onClose,
  onClick,
  currentTabHasNoAccounts,
  selectedChainIds,
  setSelectedChainIds,
  combinedNetworks,
  onDisconnectClick,
}) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const testNetworks = useSelector(getTestNetworks);
  const activeTabOrigin = useSelector(getOriginOfCurrentTab);
  const connectedNetworks = useSelector((state) =>
    getPermittedChainsForSelectedTab(state, activeTabOrigin),
  );
  const combinedNetworksIds = combinedNetworks.map(
    (network) => network.chainId,
  );
  const selectedPermittedChains =
    connectedNetworks.length > 0 ? connectedNetworks : combinedNetworksIds;

  const selectAll = () => {
    const chainIds = combinedNetworks.map((network) => network.chainId);
    setSelectedChainIds(chainIds);
  };

  const deselectAll = () => {
    setSelectedChainIds([]);
  };

  const handleNetworkClick = (chainId) => {
    if (selectedChainIds.includes(chainId)) {
      setSelectedChainIds(selectedChainIds.filter((id) => id !== chainId));
    } else {
      setSelectedChainIds([...selectedChainIds, chainId]);
    }
  };

  const allAreSelected = () => {
    return combinedNetworksIds.length === selectedChainIds.length;
  };

  let checked = false;
  let isIndeterminate = false;
  if (allAreSelected()) {
    checked = true;
    isIndeterminate = false;
  } else if (selectedChainIds.length > 0 && !allAreSelected()) {
    checked = false;
    isIndeterminate = true;
  }

  const hostName = getURLHost(activeTabOrigin);

  return (
    <Modal
      isOpen
      onClose={() => {
        onClose();
      }}
      className="edit-networks-modal"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader
          onClose={() => {
            onClose();
          }}
        >
          {t('editNetworksTitle')}
        </ModalHeader>
        <ModalBody paddingLeft={0} paddingRight={0}>
          <Box padding={4}>
            <Checkbox
              label={t('selectAll')}
              isChecked={checked}
              gap={4}
              onClick={() => (allAreSelected() ? deselectAll() : selectAll())}
              isIndeterminate={isIndeterminate}
            />
          </Box>
          {combinedNetworks.map((network) => (
            <NetworkListItem
              name={network.nickname}
              iconSrc={network?.rpcPrefs?.imageUrl}
              key={network.id}
              onClick={() => {
                handleNetworkClick(network.chainId);
              }}
              startAccessory={
                <Checkbox
                  isChecked={selectedChainIds.includes(network.chainId)}
                />
              }
            />
          ))}
          <Box padding={4}>
            <Text variant={TextVariant.bodyMdMedium}>{t('testnets')}</Text>
          </Box>
          {testNetworks.map((network) => (
            <NetworkListItem
              name={network.nickname}
              iconSrc={network?.rpcPrefs?.imageUrl}
              key={network.id}
              onClick={() => {
                handleNetworkClick(network.chainId);
              }}
              startAccessory={
                <Checkbox
                  isChecked={selectedChainIds.includes(network.chainId)}
                />
              }
              showEndAccessory={false}
            />
          ))}
          <ModalFooter>
            {selectedChainIds.length === 0 ? (
              <Box
                display={Display.Flex}
                flexDirection={FlexDirection.Column}
                gap={4}
              >
                <Box
                  display={Display.Flex}
                  gap={1}
                  alignItems={AlignItems.center}
                >
                  <Icon
                    name={IconName.Danger}
                    size={IconSize.Xs}
                    color={IconColor.errorDefault}
                  />
                  <Text
                    variant={TextVariant.bodySm}
                    color={TextColor.errorDefault}
                  >
                    {t('disconnectMessage', [hostName])}
                  </Text>
                </Box>
                <ButtonPrimary
                  data-testid="disconnect-chains-button"
                  onClick={() => {
                    onDisconnectClick();
                    onClose();
                  }}
                  size={ButtonPrimarySize.Lg}
                  block
                  danger
                >
                  {t('disconnect')}
                </ButtonPrimary>
              </Box>
            ) : (
              <ButtonPrimary
                data-testid="connect-more-accounts-button"
                onClick={() => {
                  onClick();
                  onClose();
                  if (currentTabHasNoAccounts) {
                    // dispatch(
                    //   // TODO set this via hook
                    //   setSelectedNetworksForDappConnection(selectedChains),
                    // );
                  } else {
                    // fix this
                    // managePermittedChains(
                    //   selectedChainIds,
                    //   selectedPermittedChains,
                    //   activeTabOrigin,
                    // );
                  }
                }}
                size={ButtonPrimarySize.Lg}
                block
              >
                {t('update')}
              </ButtonPrimary>
            )}
          </ModalFooter>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

EditNetworksModal.propTypes = {
  /**
   * Function to execute when the modal is closed.
   */
  onClose: PropTypes.func.isRequired,

  /**
   * Function to execute when an update action is triggered.
   */
  onClick: PropTypes.func.isRequired,

  selectedChainIds: PropTypes.arrayOf(PropTypes.string).isRequired,

  setSelectedChainIds: PropTypes.func.isRequired,

  /**
   * Boolean indicating if the current tab has no associated accounts.
   */
  currentTabHasNoAccounts: PropTypes.bool.isRequired,

  /**
   * Array of network objects representing available networks to choose from.
   */
  combinedNetworks: PropTypes.arrayOf(
    PropTypes.shape({
      chainId: PropTypes.string.isRequired, // The chain ID of the network
      nickname: PropTypes.string.isRequired, // Display name of the network
      rpcPrefs: PropTypes.shape({
        imageUrl: PropTypes.string, // Optional image URL for the network icon
      }),
    }),
  ).isRequired,

  /**
   * Function to execute when the disconnect button is clicked.
   */
  onDisconnectClick: PropTypes.func.isRequired,
};
