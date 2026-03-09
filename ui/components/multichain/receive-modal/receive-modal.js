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
  const hasClosedRef = useRef(false);

  useEffect(() => {
    endTrace({ name: TraceName.ReceiveModal });
  }, []);

  const closeOnce = useCallback(() => {
    if (hasClosedRef.current) {
      return;
    }
    hasClosedRef.current = true;
    onClose();
  }, [onClose]);

  const handleClose = useCallback(() => {
    const el = dialogRef.current?.querySelector('.mm-modal-content__dialog');
    if (!el) {
      closeOnce();
      return;
    }
    const didReplace = el.classList.replace(
      'page-enter-animation',
      'page-exit-animation',
    );
    if (!didReplace) {
      closeOnce();
      return;
    }

    el.addEventListener('animationend', closeOnce, { once: true });
    el.addEventListener('animationcancel', closeOnce, { once: true });

    window.requestAnimationFrame(() => {
      if (typeof el.getAnimations !== 'function') {
        return;
      }

      if (el.getAnimations().length === 0) {
        closeOnce();
      }
    });
  }, [closeOnce]);

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
