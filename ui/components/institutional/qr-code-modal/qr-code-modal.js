import React, { useState } from 'react';
import QRCode from 'qrcode.react';

import {
  Modal,
  ModalOverlay,
} from '../../component-library';
import { ModalContent } from '../../component-library/modal-content/deprecated';
import { ModalHeader } from '../../component-library/modal-header/deprecated';

import { useI18nContext } from '../../../hooks/useI18nContext';

export default function QRCodeModal({
  onClose
}) {
  const t = useI18nContext();

  const [currentQRCode, setCurrentQRCode] = useState('something');


  return (
    <Modal isOpen onClose={onClose}>
    <ModalOverlay />
    <ModalContent>
      <ModalHeader onClose={onClose}>
        Connect custodian
      </ModalHeader>


      <div
  style={{
    padding: 20,
    backgroundColor: 'var(--qr-code-white-background)',
  }}
>
  <QRCode value={currentQRCode.toUpperCase()} size={250} />
</div>

    </ModalContent>
  </Modal>
  );
}
