import React from 'react';
import { ETHSignature } from '@keystonehq/bc-ur-registry-eth';
import * as uuid from 'uuid';
import { useHistory } from 'react-router-dom';
import PropTypes from 'prop-types';
import BaseReader from '../base-reader';

const Reader = ({
  submitQRHardwareSignature,
  cancelQRHardwareSignRequest,
  requestId,
}) => {
  const history = useHistory();
  const cancel = () => {
    cancelQRHardwareSignRequest();
    history.goBack();
  };

  const handleSuccess = (ur) => {
    return new Promise((resolve, reject) => {
      if (ur.type === 'eth-signature') {
        const ethSignature = ETHSignature.fromCBOR(ur.cbor);
        const buffer = ethSignature.getRequestId();
        const signId = uuid.stringify(buffer);
        if (signId === requestId) {
          submitQRHardwareSignature(signId, ur.cbor.toString('hex'))
            .then(resolve)
            .catch(reject);
        } else {
          reject(new Error('#mismatched_signId'));
        }
      } else {
        reject(new Error('unknownQrCode'));
      }
    });
  };

  return <BaseReader handleCancel={cancel} handleSuccess={handleSuccess} />;
};

Reader.propTypes = {
  submitQRHardwareSignature: PropTypes.func.isRequired,
  cancelQRHardwareSignRequest: PropTypes.func.isRequired,
  requestId: PropTypes.string.isRequired,
};

export default Reader;
