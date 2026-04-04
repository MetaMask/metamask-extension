import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { completeQrCodeScan } from '../../../../store/actions';
import BaseReader, { SCAN_ERROR_TYPE } from '../base-reader';
import { useI18nContext } from '../../../../hooks/useI18nContext';

// UR types expected during wallet pairing/sync
const PAIRING_UR_TYPES = ['crypto-hdkey', 'crypto-account'];

const QRHardwareWalletImporter = ({ handleCancel, setErrorTitle }) => {
  const t = useI18nContext();
  const dispatch = useDispatch();

  const handleSuccess = useCallback(
    (ur) => {
      // State 4: Valid UR but wrong type for pairing
      if (!PAIRING_UR_TYPES.includes(ur.type)) {
        const err = new Error(`Wrong UR type for pairing: ${ur.type}`);
        err.scanErrorType = SCAN_ERROR_TYPE.WRONG_UR_TYPE;
        err.urType = ur.type;
        throw err;
      }

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
