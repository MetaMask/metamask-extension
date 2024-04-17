import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import QRCode from 'qrcode.react';
import { v4 as uuid } from 'uuid';
import { useHistory } from 'react-router-dom';
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
import { mmiActionsFactory } from '../../../store/institutional/institution-background';

export default function QRCodeModal({
  onClose,
  custodianName = 'custodian',
  custodianURL,
}) {
  const t = useContext(I18nContext);
  const history = useHistory();
  const [publicKey, setPublicKey] = useState(null);
  const [privateKey, setPrivateKey] = useState(null);
  const [decryptedMessage, setDecryptedMessage] = useState(null);
  const [qrCodeValue, setQrCodeValue] = useState(null);
  const [error, setError] = useState('');
  const channelId = useSelector(getChannelId);
  const connectionRequest = useSelector(getConnectionRequest);
  const [traceId] = useState(uuid());
  const mmiActions = mmiActionsFactory();
  const dispatch = useDispatch();

  const handleClose = useCallback(async () => {
    await dispatch(mmiActions.setConnectionRequest(null));
    onClose();
  }, [dispatch, mmiActions, onClose]);

  const generateKeys = async () => {
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 4096,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: { name: 'SHA-256' },
      },
      true,
      ['encrypt', 'decrypt'],
    );
    const exportedPublicKey = await window.crypto.subtle.exportKey(
      'spki',
      keyPair.publicKey,
    );
    const publicKeyBase64 = btoa(
      String.fromCharCode(...new Uint8Array(exportedPublicKey)),
    );

    setPublicKey(publicKeyBase64);
    setPrivateKey(keyPair.privateKey);
  };

  const decryptMessage = useCallback(
    async (payload) => {
      const encryptedBuffer = Uint8Array.from(atob(payload), (c) =>
        c.charCodeAt(0),
      );
      const decrypted = await window.crypto.subtle.decrypt(
        { name: 'RSA-OAEP' },
        privateKey,
        encryptedBuffer,
      );
      const dec = new TextDecoder();
      const decryptedStringMessage = dec.decode(decrypted);
      try {
        const jsonObject = JSON.parse(decryptedStringMessage);
        setDecryptedMessage(jsonObject);
        console.log('Decrypted JSON object:', jsonObject);
      } catch (e) {
        console.error('Failed to parse JSON:', e);
        // Handle the error if the decrypted message is not valid JSON
      }
    },
    [privateKey, setDecryptedMessage],
  );

  useEffect(() => {
    generateKeys();
  }, []);

  useEffect(() => {
    const decryptAndProcessData = async () => {
      if (connectionRequest && privateKey) {
        const { payload } = connectionRequest;
        try {
          const decryptedPayload = await decryptMessage(payload);
          console.log('Decrypted Payload:', decryptedPayload);
          // Handle the decrypted data as needed
        } catch (e) {
          console.error('Error decrypting data:', e);
          setError('Failed to decrypt data.');
        }
      }
    };

    decryptAndProcessData();
  }, [connectionRequest, decryptMessage, privateKey]);

  useEffect(() => {
    if (publicKey && channelId) {
      const value = JSON.stringify({
        publicKey,
        actionDescription: 'mmi:connect-request/qr-code?encrypted',
        channelId,
        traceId,
      });
      console.log('qrCodeValue: ', value);
      setQrCodeValue(value);
    }
  }, [publicKey, channelId, traceId]);

  useEffect(() => {
    async function setConnectRequests() {
      console.log('Decrypted Message:', decryptedMessage);
      await dispatch(mmiActions.setConnectRequests(decryptedMessage));
      await handleClose();
    }
    if (decryptedMessage) {
      setConnectRequests();
    }
  }, [decryptedMessage, dispatch, handleClose, history, mmiActions]);

  const supportLink = (
    <a
      target="_blank"
      key="metamaskSupportLink"
      rel="noopener noreferrer"
      href={custodianURL}
    >
      <span className="error-page__link-text">{custodianName}</span>
    </a>
  );

  return (
    <Modal isOpen onClose={handleClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onClose}>
          {t('connectCustodianAccounts', [custodianName])}
        </ModalHeader>
        {error && <Text color={TextColor.error}>{error}</Text>}
        {qrCodeValue === null ? (
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
        <Text
          as="p"
          paddingRight={10}
          paddingLeft={10}
          paddingBottom={4}
          color={TextColor.textDefault}
          variant={TextVariant.bodySm}
        >
          {t('custodianQRCodeScan', [custodianName])}
        </Text>
        <Text
          as="p"
          paddingRight={10}
          paddingLeft={10}
          paddingBottom={4}
          color={TextColor.textDefault}
          variant={TextVariant.bodySm}
        >
          {t('custodianQRCodeScanDescription', [supportLink])}
        </Text>
        {error && <Text color={TextColor.error}>{error}</Text>}
        {process.env.IN_TEST && (
          <span
            className="hidden"
            data-channelId={channelId}
            data-publicKey={publicKey}
          />
        )}
      </ModalContent>
    </Modal>
  );
}

QRCodeModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  custodianName: PropTypes.string.isRequired,
  custodianURL: PropTypes.string.isRequired,
};
