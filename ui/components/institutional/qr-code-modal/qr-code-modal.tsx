import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import QRCode from 'qrcode.react';
import { v4 as uuid } from 'uuid';
import { captureException } from '@sentry/browser';
import {
  Modal,
  ModalOverlay,
  Text,
  Box,
  ModalBody,
  ModalFooter,
} from '../../component-library';
import { ModalContent } from '../../component-library/modal-content/modal-content';
import { ModalHeader } from '../../component-library/modal-header/modal-header';
import {
  TextAlign,
  TextColor,
  TextVariant,
  FontWeight,
  Display,
  AlignItems,
  FlexDirection,
  BorderColor,
} from '../../../helpers/constants/design-system';
import Spinner from '../../ui/spinner';
import {
  getChannelId,
  getConnectionRequest,
} from '../../../ducks/institutional/institutional';
import { mmiActionsFactory } from '../../../store/institutional/institution-background';
import { useI18nContext } from '../../../hooks/useI18nContext';

type QRCodeModalProps = {
  onClose: () => void;
  custodianName?: string;
  custodianURL: string | undefined;
  setQrConnectionRequest: (message: string) => void;
};

const QRCodeModal: React.FC<QRCodeModalProps> = ({
  onClose,
  custodianName = 'custodian',
  custodianURL,
  setQrConnectionRequest,
}) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const channelId = useSelector(getChannelId);
  const connectionRequest = useSelector(getConnectionRequest);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [privateKey, setPrivateKey] = useState<CryptoKey | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [decryptedMessage, setDecryptedMessage] = useState<any>(null);
  const [qrCodeValue, setQrCodeValue] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [traceId] = useState<string>(uuid());
  const mmiActions = mmiActionsFactory();

  const handleClose = useCallback(async () => {
    await dispatch(mmiActions.setConnectionRequest(null));
    onClose();
  }, [dispatch, mmiActions, onClose]);

  const handleError = useCallback(
    (message: string, e: Error) => {
      const errorMessage = `${message} Please try again or contact support if the problem persists.`;
      console.error(message, e);
      setError(errorMessage);
      captureException(e);
    },
    [setError],
  );

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
        btoa(
          String.fromCharCode(...Array.from(new Uint8Array(exportedPublicKey))),
        ),
      );

      setPrivateKey(keyPair.privateKey);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      handleError('An error occurred while generating cryptographic keys.', e);
    }
  }, [handleError]);

  const decrypt = useCallback(
    async (_privateKey: CryptoKey, encryptedData: string) => {
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        handleError('An error occurred while decrypting data.', e);
        throw e;
      }
    },
    [handleError],
  );

  useEffect(() => {
    generateKeyPair();
  }, []);

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
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
    <Modal isOpen onClose={handleClose} className="institutional-qr-code-modal">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={handleClose}>
          {t('connectCustodianAccounts', [custodianName])}
        </ModalHeader>

        <ModalBody>
          {error && (
            <Text color={TextColor.errorDefault} variant={TextVariant.bodySm}>
              {error}
            </Text>
          )}
          <Box
            className="institutional-qr-code-modal__qr-code"
            data-testid="qr-code-visible"
            paddingTop={6}
            paddingBottom={6}
            marginBottom={4}
            marginTop={4}
            display={Display.Flex}
            alignItems={AlignItems.center}
            flexDirection={FlexDirection.Column}
            borderColor={BorderColor.borderMuted}
            borderWidth={1}
          >
            {qrCodeValue ? (
              <QRCode value={qrCodeValue} size={270} />
            ) : (
              <Spinner className="institutional-qr-code-modal__spinner" />
            )}
          </Box>
          <Text
            paddingBottom={4}
            color={TextColor.textDefault}
            textAlign={TextAlign.Center}
            fontWeight={FontWeight.Bold}
          >
            {t('custodianQRCodeScan', [custodianName])}
          </Text>
          <Text
            color={TextColor.textDefault}
            variant={TextVariant.bodySm}
            textAlign={TextAlign.Center}
          >
            {t('custodianQRCodeScanDescription', [custodianLink])}
          </Text>
        </ModalBody>
        <ModalFooter
          onCancel={handleClose}
          cancelButtonProps={{
            children: t('cancel'),
            'data-testid': 'cancel-btn',
          }}
        />
        <span className="hidden" data-value={qrCodeValue} />
      </ModalContent>
    </Modal>
  );
};

export default QRCodeModal;
