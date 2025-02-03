import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  AlignItems,
  BlockSize,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
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
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../shared/constants/network';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';

export const EditNetworksModal = ({
  nonTestNetworks,
  testNetworks,
  defaultSelectedChainIds,
  onClose,
  onSubmit,
}) => {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const allNetworks = [...nonTestNetworks, ...testNetworks];

  const [selectedChainIds, setSelectedChainIds] = useState(
    defaultSelectedChainIds,
  );

  useEffect(() => {
    setSelectedChainIds(defaultSelectedChainIds);
  }, [
    // TODO: Fix the source of this prop value to be the same array instance each render
    JSON.stringify(defaultSelectedChainIds),
  ]);

  const selectAll = () => {
    const allNetworksChainIds = allNetworks.map(({ chainId }) => chainId);
    setSelectedChainIds(allNetworksChainIds);
  };

  const deselectAll = () => {
    setSelectedChainIds([]);
  };

  const handleNetworkClick = (chainId) => {
    if (selectedChainIds.includes(chainId)) {
      setSelectedChainIds(
        selectedChainIds.filter((_chainId) => _chainId !== chainId),
      );
    } else {
      setSelectedChainIds([...selectedChainIds, chainId]);
    }
  };

  const allAreSelected = () => {
    return allNetworks.length === selectedChainIds.length;
  };

  const checked = allAreSelected();
  const isIndeterminate = !checked && selectedChainIds.length > 0;

  const defaultChainIdsSet = new Set(defaultSelectedChainIds);
  const selectedChainIdsSet = new Set(selectedChainIds);

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
        <ModalBody
          paddingLeft={0}
          paddingRight={0}
          className="edit-networks-modal__body"
        >
          <Box padding={4}>
            <Checkbox
              label={t('selectAll')}
              isChecked={checked}
              gap={4}
              onClick={() => (allAreSelected() ? deselectAll() : selectAll())}
              isIndeterminate={isIndeterminate}
            />
          </Box>
          {nonTestNetworks.map((network) => (
            <NetworkListItem
              name={network.name}
              iconSrc={CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[network.chainId]}
              key={network.chainId}
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
              name={network.name}
              iconSrc={CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[network.chainId]}
              key={network.chainId}
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
        </ModalBody>
        <ModalFooter>
          {selectedChainIds.length === 0 ? (
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              gap={4}
              alignItems={AlignItems.center}
              width={BlockSize.Full}
            >
              <Box
                display={Display.Flex}
                gap={1}
                alignItems={AlignItems.center}
                justifyContent={JustifyContent.center}
              >
                <Icon
                  name={IconName.Danger}
                  size={IconSize.Sm}
                  color={IconColor.errorDefault}
                />
                <Text
                  variant={TextVariant.bodySm}
                  color={TextColor.errorDefault}
                >
                  {t('disconnectMessage')}
                </Text>
              </Box>
              <ButtonPrimary
                data-testid="disconnect-chains-button"
                onClick={() => {
                  onSubmit(selectedChainIds);
                  // Get networks that are in `selectedChainIds` but not in `defaultSelectedChainIds`
                  const addedNetworks = selectedChainIds.filter(
                    (chainId) => !defaultChainIdsSet.has(chainId),
                  );

                  // Get networks that are in `defaultSelectedChainIds` but not in `selectedChainIds`
                  const removedNetworks = defaultSelectedChainIds.filter(
                    (chainId) => !selectedChainIdsSet.has(chainId),
                  );

                  trackEvent({
                    category: MetaMetricsEventCategory.Permissions,
                    event: MetaMetricsEventName.UpdatePermissionedNetworks,
                    properties: {
                      addedNetworks: addedNetworks.length,
                      removedNetworks: removedNetworks.length,
                      location: 'Edit Networks Modal',
                    },
                  });
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
              data-testid="connect-more-chains-button"
              onClick={() => {
                onSubmit(selectedChainIds);
                onClose();
              }}
              size={ButtonPrimarySize.Lg}
              block
            >
              {t('update')}
            </ButtonPrimary>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

EditNetworksModal.propTypes = {
  /**
   * Array of network objects representing available non-test networks to choose from.
   */
  nonTestNetworks: PropTypes.arrayOf(
    PropTypes.shape({
      chainId: PropTypes.string.isRequired, // The chain ID of the network
      name: PropTypes.string.isRequired, // Display name of the network
    }),
  ).isRequired,

  /**
   * Array of network objects representing available test networks to choose from.
   */
  testNetworks: PropTypes.arrayOf(
    PropTypes.shape({
      chainId: PropTypes.string.isRequired, // The chain ID of the network
      name: PropTypes.string.isRequired, // Display name of the network
    }),
  ).isRequired,

  /**
   * Array of chain IDs to have selected by default.
   */
  defaultSelectedChainIds: PropTypes.arrayOf(PropTypes.string),

  /**
   * Function to execute when the modal is closed.
   */
  onClose: PropTypes.func.isRequired,

  /**
   * Function to execute when an update or disconnect action is triggered.
   */
  onSubmit: PropTypes.func.isRequired,
};
