import React from 'react';
import PropTypes from 'prop-types';
import { submitQRHardwareCryptoHDKey } from '../../../../store/actions';
import BaseReader from '../base-reader';
import { useI18nContext } from '../../../../hooks/useI18nContext';

const QRHardwareWalletImporter = ({ handleCancel }) => {
  const t = useI18nContext();
  const handleSuccess = (ur) => {
    return new Promise((resolve, reject) => {
      if (ur.type === 'crypto-hdkey') {
        submitQRHardwareCryptoHDKey(ur.cbor.toString('hex'))
          .then(resolve)
          .catch(reject);
      } else {
        reject(new Error(t('unknownQrCode')));
      }
    });
  };

  return (
    <BaseReader handleCancel={handleCancel} handleSuccess={handleSuccess} />
  );
};

QRHardwareWalletImporter.propTypes = {
  handleCancel: PropTypes.func.isRequired,
};

export default QRHardwareWalletImporter;
