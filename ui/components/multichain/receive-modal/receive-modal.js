import React, { useCallback, useEffect, useMemo, useRef } from 'react';
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
import { endTrace, TraceName } from '../../../../shared/lib/trace';

export const ReceiveModal = ({ address, onClose }) => {
  const t = useI18nContext();
  const {
    metadata: { name },
  } = useSelector((state) => getInternalAccountByAddress(state, address));
  const data = useMemo(() => ({ data: address }), [address]);
  const dialogRef = useRef(null);

  useEffect(() => {
    endTrace({ name: TraceName.ReceiveModal });
  }, []);

  const handleClose = useCallback(() => {
    const el = dialogRef.current?.querySelector('.mm-modal-content__dialog');
    if (!el) {
      onClose();
      return;
    }
    el.classList.replace('page-enter-animation', 'page-exit-animation');
    el.addEventListener('animationend', onClose, { once: true });
  }, [onClose]);

  return (
    <Modal isOpen onClose={handleClose}>
      <ModalOverlay />
      <ModalContent
        ref={dialogRef}
        modalDialogProps={{ className: 'page-enter-animation' }}
      >
        <ModalHeader marginBottom={4} onClose={handleClose}>
          {t('receive')}
        </ModalHeader>
        <Box
          display={Display.Flex}
          alignItems={AlignItems.center}
          flexDirection={FlexDirection.Column}
          paddingInlineEnd={4}
          paddingInlineStart={4}
        >
          <QrCodeView Qr={data} accountName={name} />
        </Box>
      </ModalContent>
    </Modal>
  );
};

ReceiveModal.propTypes = {
  address: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};
