import PropTypes from 'prop-types';
import React from 'react';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getNonTestNetworks, getTestNetworks } from '../../../selectors/index';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  Checkbox
} from '../../component-library';
import { NetworkListItem } from '../index';

export const EditNetworksModal = ({ onClose }) => {
  const t = useI18nContext();
    const nonTestNetworks = useSelector(getNonTestNetworks);
    const testNetworks = useSelector(getTestNetworks);
  return (
    <Modal
      isOpen
      onClose={() => {
        onClose();
      }}
      className="import-nfts-modal"
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
        {nonTestNetworks.map((network) => (
          <NetworkListItem
            name={network.nickname}
            iconSrc={network?.rpcPrefs?.imageUrl}
            key={network.id}
            onClick={() => {
              console.log(network.id);
            }}
            startAccessory={<Checkbox isChecked={true} />}
          />
        ))}
        {testNetworks.map((network) => (
          <NetworkListItem
            name={network.nickname}
            iconSrc={network?.rpcPrefs?.imageUrl}
            key={network.id}
            onClick={() => {
              console.log(network.id);
            }}
            startAccessory={<Checkbox isChecked={true} />}
          />
        ))}
      </ModalContent>
    </Modal>
  );
};

EditNetworksModal.propTypes = {
  /**
   * Executes when the modal closes
   */
  onClose: PropTypes.func.isRequired,
};
