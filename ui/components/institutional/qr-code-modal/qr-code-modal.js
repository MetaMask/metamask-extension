import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import QRCode from 'qrcode.react';
import { v4 as uuid } from 'uuid';
import { captureException } from '@sentry/browser';
import {
  Modal,
  ModalOverlay,
  Text,
  Box,
  ButtonLink,
} from '../../component-library';
import { ModalContent } from '../../component-library/modal-content/modal-content';
import { ModalHeader } from '../../component-library/modal-header/modal-header';
import {
  TextAlign,
  TextColor,
  TextVariant,
  FontWeight,
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
  setQrConnectionRequest,
}) {
  const t = useContext(I18nContext);
  const dispatch = useDispatch();
  const channelId = useSelector(getChannelId);
  const connectionRequest = useSelector(getConnectionRequest);
  const [publicKey, setPublicKey] = useState(null);
  const [privateKey, setPrivateKey] = useState(null);
  const [decryptedMessage, setDecryptedMessage] = useState(null);
  const [qrCodeValue, setQrCodeValue] = useState(null);
  const [error, setError] = useState('');
  const [traceId] = useState(uuid());
  const mmiActions = mmiActionsFactory();

  const handleClose = useCallback(async () => {
    await dispatch(mmiActions.setConnectionRequest(null));
    onClose();
  }, [dispatch, mmiActions, onClose]);

  const handleError = useCallback((message, e) => {
    const errorMessage = `${message} Please try again or contact support if the problem persists.`;
    console.error(message, e);
    setError(errorMessage);
    captureException(e);
  }, []);

  const generateKeyPair = useCallback(async () => {
    try {
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

      setPublicKey(
        btoa(String.fromCharCode(...new Uint8Array(exportedPublicKey))),
      );

      setPrivateKey(keyPair.privateKey);
    } catch (e) {
      handleError('An error occurred while generating cryptographic keys.', e);
    }
  }, [handleError]);

  const decrypt = useCallback(
    async (_privateKey, encryptedData) => {
      try {
        const encryptedBuffer = Uint8Array.from(atob(encryptedData), (c) =>
          c.charCodeAt(0),
        );
        const decrypted = await window.crypto.subtle.decrypt(
          { name: 'RSA-OAEP' },
          _privateKey,
          encryptedBuffer,
        );
        const decryptedString = new TextDecoder().decode(decrypted);
        return JSON.parse(decryptedString);
      } catch (e) {
        handleError('An error occurred while decrypting data.', e);
        throw e;
      }
    },
    [handleError],
  );

  useEffect(() => {
    generateKeyPair();
  }, [generateKeyPair]);

  useEffect(() => {
    const decryptAndProcessData = async () => {
      if (connectionRequest && privateKey) {
        try {
          const decryptedPayload = await decrypt(
            privateKey,
            connectionRequest.payload,
          );

          setDecryptedMessage(decryptedPayload);
        } catch (e) {
          // Error handling is managed by the decrypt function
        }
      }
    };

    decryptAndProcessData();
  }, [connectionRequest, privateKey, decrypt]);

  useEffect(() => {
    if (publicKey && channelId) {
      const value = JSON.stringify({
        publicKey,
        actionDescription: 'mmi:connect-request/qr-code?encrypted',
        channelId,
        traceId,
      });

      setQrCodeValue(value);
    }
  }, [publicKey, channelId, traceId]);

  useEffect(() => {
    const updateConnectRequests = async () => {
      try {
        setQrConnectionRequest(decryptedMessage);
        handleClose();
      } catch (e) {
        handleError('An error occurred while updating connection requests.', e);
      }
    };

    if (decryptedMessage) {
      updateConnectRequests();
    }
  }, [
    decryptedMessage,
    dispatch,
    mmiActions,
    handleClose,
    handleError,
    setQrConnectionRequest,
  ]);

  const custodianLink = (
    <a
      target="_blank"
      key="custodianUrl"
      rel="noopener noreferrer"
      href={custodianURL}
    >
      <Text
        as="span"
        color={TextColor.primaryDefault}
        variant={TextVariant.bodySm}
      >
        {custodianName}
      </Text>
    </a>
  );

  return (
    <Modal isOpen onClose={handleClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={handleClose}>
          {t('connectCustodianAccounts', [custodianName])}
        </ModalHeader>
        {error && <Text color={TextColor.error}>{error}</Text>}
        {qrCodeValue ? (
          <Box
            data-testid="qr-code-visible"
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
        ) : (
          <Spinner color="var(--color-warning-default)" />
        )}
        <Text
          as="p"
          paddingRight={10}
          paddingLeft={10}
          paddingBottom={4}
          color={TextColor.textDefault}
          textAlign={TextAlign.Center}
          fontWeight={FontWeight.bodySmBold}
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
          textAlign={TextAlign.Center}
        >
          {t('custodianQRCodeScanDescription', [custodianLink])}
        </Text>
        <ButtonLink
          as="p"
          paddingRight={10}
          paddingLeft={10}
          paddingBottom={4}
          variant={TextVariant.bodySm}
          textAlign={TextAlign.Center}
          color={TextColor.primaryDefault}
          onClick={handleClose}
          data-testid="cancel-btn"
        >
          {t('cancel')}
        </ButtonLink>
        <span className="hidden" data-value={qrCodeValue} />
      </ModalContent>
    </Modal>
  );
}

QRCodeModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  custodianName: PropTypes.string.isRequired,
  custodianURL: PropTypes.string.isRequired,
  setQrConnectionRequest: PropTypes.func.isRequired,
};
