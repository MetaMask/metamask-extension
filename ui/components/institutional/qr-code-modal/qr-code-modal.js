import React, { useState, useEffect, useContext, useRef } from 'react';
import PropTypes from 'prop-types';
import QRCode from 'qrcode.react';
import { useHistory } from 'react-router-dom';

import { Modal, ModalOverlay, Text, Box } from '../../component-library';
import { ModalContent } from '../../component-library/modal-content/modal-content';
import { ModalHeader } from '../../component-library/modal-header/modal-header';
import {
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { I18nContext } from '../../../contexts/i18n';
import { CONFIRM_ADD_CUSTODIAN_TOKEN } from '../../../helpers/constants/routes';
import Spinner from '../../ui/spinner';

export default function QRCodeModal({ onClose, custodianName }) {
  const history = useHistory();
  const t = useContext(I18nContext);
  const [publicKeyData, setPublicKeyData] = useState(null);
  const [error, setError] = useState('');
  const pollingIntervalRef = useRef(null);

  async function generatePublicKey() {
    try {
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: 'RSA-OAEP',
          modulusLength: 2048,
          publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
          hash: 'SHA-256',
        },
        true,
        ['encrypt', 'decrypt'],
      );

      const exportedPublicKey = await window.crypto.subtle.exportKey(
        'spki',
        keyPair.publicKey,
      );
      const publicKeyBase64 = Buffer.from(exportedPublicKey)
        .toString('base64')
        .replace(/\+/gu, '-')
        .replace(/\//gu, '_')
        .replace(/[=]+$/u, '');

      setPublicKeyData(publicKeyBase64);
    } catch (e) {
      console.error('Error generating public key:', e);
      setError('Error generating public key. Please try again.');
    }
  }

  useEffect(() => {
    generatePublicKey();
  }, []);

  useEffect(() => {
    async function checkForConnectRequests() {
      try {
        const response = await fetch(
          'https://mmi-qr-server.adaptable.app/connect-requests/latest',
        );
        const data = await response.json();

        if (data) {
          await fetch(
            'https://mmi-qr-server.adaptable.app/connect-requests/latest',
            { method: 'DELETE' },
          );

          data.custodian = data.environment;
          // eslint-disable-next-line no-undef
          localStorage.setItem('tempConnectRequest', JSON.stringify(data));

          history.push(CONFIRM_ADD_CUSTODIAN_TOKEN);
          onClose();
        }
      } catch (e) {
        console.log('No data from QR Code API at this time', e);
      }
    }

    pollingIntervalRef.current = setInterval(checkForConnectRequests, 5000);

    return () => clearInterval(pollingIntervalRef.current);
  }, [history, onClose]);

  const qrCodeValue = JSON.stringify({
    custodianName,
    publicKey: publicKeyData,
  });

  return (
    <Modal isOpen onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onClose}>
          {t('connectCustodianAccounts', [custodianName || 'custodian'])}
        </ModalHeader>
        <Text
          as="p"
          paddingRight={10}
          paddingLeft={10}
          paddingBottom={4}
          color={TextColor.textDefault}
          variant={TextVariant.bodySm}
        >
          {t('custodianQRCodeScan')}
        </Text>
        {error && <Text color={TextColor.error}>{error}</Text>}
        {publicKeyData === null && (
          <Spinner color="var(--color-warning-default)" />
        )}
        {publicKeyData && (
          <Box
            style={{
              padding: 20,
              backgroundColor: 'var(--qr-code-white-background)',
              display: 'flex',
              alignItems: 'center',
              flexDirection: 'column',
            }}
          >
            <QRCode value={qrCodeValue} size={270} />
          </Box>
        )}
      </ModalContent>
    </Modal>
  );
}

QRCodeModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  custodianName: PropTypes.string.isRequired,
};
