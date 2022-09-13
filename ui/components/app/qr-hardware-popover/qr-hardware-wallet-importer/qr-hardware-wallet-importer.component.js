import React from 'react';
import PropTypes from 'prop-types';
import {
  submitQRHardwareCryptoAccount,
  submitQRHardwareCryptoHDKey,
} from '../../../../store/actions';
import BaseReader from '../base-reader';
import { useI18nContext } from '../../../../hooks/useI18nContext';

const QRHardwareWalletImporter = ({ handleCancel, setErrorTitle }) => {
  const t = useI18nContext();
  const handleSuccess = async (ur) => {
    if (ur.type === 'crypto-hdkey') {
      return await submitQRHardwareCryptoHDKey(ur.cbor.toString('hex'));
    } else if (ur.type === 'crypto-account') {
      return await submitQRHardwareCryptoAccount(ur.cbor.toString('hex'));
    }
    setErrorTitle(t('QRHardwareUnknownQRCodeTitle'));
    throw new Error(t('unknownQrCode'));
  };

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
