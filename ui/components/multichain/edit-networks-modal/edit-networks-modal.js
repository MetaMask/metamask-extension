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
  setSelectedNetworksForDappConnection,
} from '../../../store/actions';
import { getURLHost } from '../../../helpers/utils/util';

export const EditNetworksModal = ({
  onClose,
  onClick,
  currentTabHasNoAccounts,
  combinedNetworks,
  onDisconnectClick,
  defaultNetworks,
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
  const [selectedChains, setSelectedChains] = useState(selectedPermittedChains);

  const selectAll = () => {
    const newSelectedAccounts = combinedNetworks.map(
      (network) => network.chainId,
    );
    setSelectedChains(newSelectedAccounts);
  };

  const deselectAll = () => {
    setSelectedChains([]);
  };

  const handleAccountClick = (chainId) => {
    if (selectedChains.includes(chainId)) {
      // Remove the chainId from the selectedChains
      setSelectedChains(selectedChains.filter((id) => id !== chainId));
    } else {
      // Add the chainId to selectedChains
      setSelectedChains([...selectedChains, chainId]);
    }
  };

  const allAreSelected = () => {
    return combinedNetworksIds.length === selectedChains.length;
  };

  let checked = false;
  let isIndeterminate = false;
  if (allAreSelected()) {
    checked = true;
    isIndeterminate = false;
  } else if (selectedChains.length > 0 && !allAreSelected()) {
    checked = false;
    isIndeterminate = true;
  }

  const managePermittedChains = (
    selectedChains,
    selectedPermittedChains,
    activeTabOrigin,
  ) => {
    if (!Array.isArray(selectedChains)) {
      console.error('selectedChains is not an array:', selectedChains);
      selectedChains = [];
    }
    dispatch(grantPermittedChains(activeTabOrigin, selectedChains));

    const removedElements = selectedPermittedChains.filter(
      (chain) => !selectedChains.includes(chain),
    );

    // Dispatch removePermittedChains for each removed element
    removedElements.forEach((chain) => {
      const selectedChain = [chain];
      dispatch(removePermittedChain(activeTabOrigin, selectedChain));
    });
  };

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
                handleAccountClick(network.chainId);
              }}
              startAccessory={
                <Checkbox
                  isChecked={selectedChains.includes(network.chainId)}
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
                handleAccountClick(network.chainId);
              }}
              startAccessory={
                <Checkbox
                  isChecked={selectedChains.includes(network.chainId)}
                />
              }
              showEndAccessory={false}
            />
          ))}
          <ModalFooter>
            {selectedChains.length === 0 ? (
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
                    dispatch(
                      setSelectedNetworksForDappConnection(selectedChains),
                    );
                  } else {
                    managePermittedChains(
                      selectedChains,
                      selectedPermittedChains,
                      activeTabOrigin,
                    );
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

  /**
   * Array of network objects representing default networks.
   */
  defaultNetworks: PropTypes.arrayOf(
    PropTypes.shape({
      chainId: PropTypes.string.isRequired, // The chain ID of the default network
      nickname: PropTypes.string.isRequired, // Display name of the default network
    }),
  ),
};
