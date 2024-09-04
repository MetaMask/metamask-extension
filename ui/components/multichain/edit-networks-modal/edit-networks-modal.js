import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { TextVariant } from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getNonTestNetworks,
  getOriginOfCurrentTab,
  getPermittedChainsByOrigin,
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
} from '../../component-library';
import { NetworkListItem } from '..';
import {
  grantPermittedChains,
  removePermittedChain,
} from '../../../store/actions';

export const EditNetworksModal = ({ onClose, onClick }) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const nonTestNetworks = useSelector(getNonTestNetworks);
  const testNetworks = useSelector(getTestNetworks);
  const chains = useSelector(getPermittedChainsByOrigin);
  const permittedChains = Object.values(chains);
  const activeTabOrigin = useSelector(getOriginOfCurrentTab);
  const flattenedPermittedChains = permittedChains.flat();
  const [selectedChains, setSelectedChains] = useState(
    flattenedPermittedChains,
  );

  const handleAccountClick = (chainId) => {
    const index = selectedChains.indexOf(chainId);
    let newSelectedChains = [];

    if (index === -1) {
      // If chainId is not already selected, add it to the selectedChains array
      newSelectedChains = [...selectedChains, chainId];
    } else {
      // If chainId is already selected, remove it from the selectedChains array
      newSelectedChains = selectedChains.filter((_item, idx) => idx !== index);
    }
    setSelectedChains(newSelectedChains);
  };
  const allAreSelected = () => {
    return nonTestNetworks.length === selectedChains.length;
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
    flattenedPermittedChains,
    activeTabOrigin,
  ) => {
    if (!Array.isArray(selectedChains)) {
      console.error('selectedChains is not an array:', selectedChains);
      selectedChains = [];
    }
    dispatch(grantPermittedChains(activeTabOrigin, selectedChains));

    const removedElements = flattenedPermittedChains.filter(
      (chain) => !selectedChains.includes(chain),
    );

    // Dispatch removePermittedChains for each removed element
    removedElements.forEach((chain) => {
      const selectedChain = [chain];
      dispatch(removePermittedChain(activeTabOrigin, selectedChain));
    });
  };
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
            name={network.nickname}
            iconSrc={network?.rpcPrefs?.imageUrl}
            key={network.id}
            onClick={() => {
              handleAccountClick(network.chainId);
            }}
            startAccessory={
              <Checkbox isChecked={selectedChains.includes(network.chainId)} />
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
              <Checkbox isChecked={selectedChains.includes(network.chainId)} />
            }
            showEndAccessory={false}
          />
        ))}
        <ModalFooter>
          {selectedChains.length === 0 ? (
            <ButtonPrimary
              data-testid="disconnect-chains-button"
              onClick={() => {
                // disconnectAllAccounts();
                onClose();
              }}
              size={ButtonPrimarySize.Lg}
              block
              danger
            >
              {t('disconnect')}
            </ButtonPrimary>
          ) : (
            <ButtonPrimary
              data-testid="connect-more-accounts-button"
              onClick={() => {
                onClick();
                onClose();
                managePermittedChains(
                  selectedChains,
                  flattenedPermittedChains,
                  activeTabOrigin,
                ); // Then call the managePermittedChains function
              }}
              size={ButtonPrimarySize.Lg}
              block
            >
              {t('confirm')}
            </ButtonPrimary>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

EditNetworksModal.propTypes = {
  /**
   * Executes when the modal closes
   */
  onClose: PropTypes.func.isRequired,
  /**
   * Executes when the permissions are updated to show the toggle
   */
  onClick: PropTypes.func.isRequired,
};
