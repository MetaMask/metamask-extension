import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { completeQrCodeScan } from '../../../../store/actions';
import BaseReader from '../base-reader';
import { useI18nContext } from '../../../../hooks/useI18nContext';

const QRHardwareWalletImporter = ({ handleCancel, setErrorTitle }) => {
  const t = useI18nContext();
  const dispatch = useDispatch();

  const handleSuccess = useCallback(
    (ur) => {
      try {
        return dispatch(
          completeQrCodeScan({
            type: ur.type,
            cbor: ur.cbor.toString('hex'),
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
    <BaseReader
      isReadingWallet
      handleCancel={handleCancel}
      handleSuccess={handleSuccess}
      setErrorTitle={setErrorTitle}
    />
  );
};

QRHardwareWalletImporter.propTypes = {
  handleCancel: PropTypes.func.isRequired,
  setErrorTitle: PropTypes.func.isRequired,
};

export default QRHardwareWalletImporter;
