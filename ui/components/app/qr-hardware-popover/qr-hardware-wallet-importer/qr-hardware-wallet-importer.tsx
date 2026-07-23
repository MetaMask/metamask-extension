import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import type { UR } from '@ngraveio/bc-ur';
import { completeQrCodeScan } from '../../../../store/actions';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import BaseQrReader, {
  CBOR_ENCODING,
  PAIRING_EXPECTED_UR_TYPES,
} from '../base-qr-reader';
import type { QRHardwareWalletImporterProps } from './qr-hardware-wallet-importer.types';

/**
 * Camera-scanner component for the QR wallet import (pairing) flow.
 *
 * Wraps BaseQrReader in wallet-reading mode and dispatches the scanned QR code
 * data for account import. If the dispatch fails, it surfaces the error to
 * the user through the popover heading.
 *
 * @param props - Component props.
 * @param props.handleCancel - Called when the user cancels the wallet import.
 * @param props.setErrorTitle - Sets the popover title to an error heading.
 * @param props.setErrorActive - Signals the parent that the scanner is showing error content.
 */
const QRHardwareWalletImporter = ({
  handleCancel,
  setErrorTitle,
  setErrorActive,
}: QRHardwareWalletImporterProps) => {
  const t = useI18nContext();
  const dispatch = useDispatch();

  const handleSuccess = useCallback(
    async (ur: UR) => {
      try {
        // dispatch() is typed as returning void, but Redux Thunk returns a
        // Promise at runtime. The await is required so the catch block can
        // intercept async rejections from the thunk.
        await dispatch(
          completeQrCodeScan({
            type: ur.type,
            cbor: ur.cbor.toString(CBOR_ENCODING),
          }),
        );
      } catch (error) {
        setErrorTitle(t('QRHardwareUnknownQRCodeTitle'));
        throw error;
      }
    },
    [dispatch, setErrorTitle, t],
  );

  return (
    <BaseQrReader
      isReadingWallet
      expectedUrTypes={PAIRING_EXPECTED_UR_TYPES}
      handleCancel={handleCancel}
      handleSuccess={handleSuccess}
      setErrorTitle={setErrorTitle}
      setErrorActive={setErrorActive}
    />
  );
};

export default QRHardwareWalletImporter;
