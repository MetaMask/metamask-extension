import React from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import {
  Box,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
} from '../../component-library';
import QrCodeView from '../../ui/qr-code-view';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getInternalAccountByAddress } from '../../../selectors';
import {
  AlignItems,
  Display,
  FlexDirection,
} from '../../../helpers/constants/design-system';

export const ReceiveModal = ({ address, onClose }) => {
  const t = useI18nContext();
  const {
    metadata: { name },
  } = useSelector((state) => getInternalAccountByAddress(state, address));

  return (
    <Modal isOpen onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader marginBottom={4} onClose={onClose}>
          {t('receive')}
        </ModalHeader>
        <Box
          display={Display.Flex}
          alignItems={AlignItems.center}
          flexDirection={FlexDirection.Column}
          paddingInlineEnd={4}
          paddingInlineStart={4}
        >
          <QrCodeView Qr={{ data: address }} accountName={name} />
        </Box>
      </ModalContent>
    </Modal>
  );
};

ReceiveModal.propTypes = {
  address: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};
