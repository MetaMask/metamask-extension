import React, { useState, useEffect, useContext } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import QRCode from 'qrcode.react';
import { v4 as uuid } from 'uuid';
import { Modal, ModalOverlay, Text, Box } from '../../component-library';
import { ModalContent } from '../../component-library/modal-content/modal-content';
import { ModalHeader } from '../../component-library/modal-header/modal-header';
import {
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { I18nContext } from '../../../contexts/i18n';
import Spinner from '../../ui/spinner';
import {
  getChannelId,
  getConnectionRequest,
} from '../../../ducks/institutional/institutional';

export default function QRCodeModal({ onClose, custodianName }) {
  const t = useContext(I18nContext);
  const [publicKeyData, setPublicKeyData] = useState(null);
  const [error, setError] = useState('');
  const channelId = useSelector(getChannelId);
  const connectionRequest = useSelector(getConnectionRequest);
  const [traceId] = useState(uuid());

  async function generatePublicKey() {
    try {
      const { publicKey, privateKey } = await window.crypto.subtle.generateKey(
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
        publicKey,
      );

      const publicKeyBase64 = Buffer.from(exportedPublicKey).toString('base64');
      console.log('publicKeyBase64: ', publicKeyBase64);
      console.log('privateKey: ', privateKey);
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
    if (connectionRequest) {
      console.log('connectionRequest: ', connectionRequest);
    }
  }, [connectionRequest]);

  const [qrCodeValue, setQrCodeValue] = useState('');
  useEffect(() => {
    if (publicKeyData && channelId) {
      const value = JSON.stringify({
        publicKey: publicKeyData,
        actionDescription: 'mmi:connect-request/qr-code?encrypted',
        channelId,
        traceId,
      });
      console.log('qrCodeValue: ', value);
      setQrCodeValue(value);
    }
  }, [publicKeyData, channelId, traceId]);

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
        {publicKeyData === null ? (
          <Spinner color="var(--color-warning-default)" />
        ) : (
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
