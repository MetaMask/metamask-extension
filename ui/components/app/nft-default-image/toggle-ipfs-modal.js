import React from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import {
  Box,
  ButtonPrimary,
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { setIpfsGateway } from '../../../store/actions';
import { IPFS_DEFAULT_GATEWAY_URL } from '../../../../shared/constants/network';

export const ToggleIpfsModal = ({ onClose }) => {
  const t = useI18nContext();
  const dispatch = useDispatch();

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
          {t('showNft')}
        </ModalHeader>
        <Box>
          {t('ipfsToggleModalDescriptionOne')}

          {t('ipfsToggleModalDescriptionTwo', [
            <p key="text">{t('ipfsToggleModalSettings')}</p>,
          ])}
        </Box>
        <ButtonPrimary
          onClick={() => dispatch(setIpfsGateway(IPFS_DEFAULT_GATEWAY_URL))}
        >
          {t('confirm')}
        </ButtonPrimary>
      </ModalContent>
    </Modal>
  );
};

ToggleIpfsModal.propTypes = {
  onClose: PropTypes.func.isRequired,
};
