import React from 'react';
import { ETHSignature } from '@keystonehq/bc-ur-registry-eth';
import * as uuid from 'uuid';
import PropTypes from 'prop-types';
import BaseReader, { SCAN_ERROR_TYPE } from '../base-reader';
import { useI18nContext } from '../../../../hooks/useI18nContext';

const Reader = ({
  submitQRHardwareSignature,
  cancelQRHardwareSignRequest,
  requestId,
  setErrorTitle,
}) => {
  const t = useI18nContext();
  const cancel = () => {
    cancelQRHardwareSignRequest();
  };

  const handleSuccess = async (ur) => {
    // State 4: Valid UR but wrong type for signing
    if (ur.type !== 'eth-signature') {
      const err = new Error(`Wrong UR type for signing: ${ur.type}`);
      err.scanErrorType = SCAN_ERROR_TYPE.WRONG_UR_TYPE;
      err.urType = ur.type;
      throw err;
    }
    const ethSignature = ETHSignature.fromCBOR(ur.cbor);
    const buffer = ethSignature.getRequestId();
    const signId = uuid.stringify(buffer);

    if (signId !== requestId) {
      setErrorTitle(t('QRHardwareInvalidTransactionTitle'));
      throw new Error(t('QRHardwareMismatchedSignId'));
    }

    return await submitQRHardwareSignature({
      type: ur.type,
      cbor: ur.cbor.toString('hex'),
    });
  };

  return (
    <BaseReader
      isReadingWallet={false}
      handleCancel={cancel}
      handleSuccess={handleSuccess}
      setErrorTitle={setErrorTitle}
    />
  );
};

Reader.propTypes = {
  submitQRHardwareSignature: PropTypes.func.isRequired,
  cancelQRHardwareSignRequest: PropTypes.func.isRequired,
  requestId: PropTypes.string.isRequired,
  setErrorTitle: PropTypes.func.isRequired,
};

export default Reader;
