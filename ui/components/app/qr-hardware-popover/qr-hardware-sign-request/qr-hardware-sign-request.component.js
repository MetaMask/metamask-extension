import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { submitQRHardwareSignature } from '../../../../store/actions';
import Player from './player';
import Reader from './reader';

const QRHardwareSignRequest = ({ request, handleCancel, setErrorTitle }) => {
  const [status, setStatus] = useState('play');

  const toRead = useCallback(() => setStatus('read'), []);

  const renderPlayer = () => {
    const { payload } = request;
    return (
      <Player
        type={payload.type}
        cbor={payload.cbor}
        cancelQRHardwareSignRequest={handleCancel}
        toRead={toRead}
      />
    );
  };

  const renderReader = () => {
    return (
      <Reader
        cancelQRHardwareSignRequest={handleCancel}
        submitQRHardwareSignature={submitQRHardwareSignature}
        requestId={request.requestId}
        setErrorTitle={setErrorTitle}
      />
    );
  };

  if (status === 'play') {
    return renderPlayer();
  }
  return renderReader();
};

QRHardwareSignRequest.propTypes = {
  request: PropTypes.object.isRequired,
  handleCancel: PropTypes.func.isRequired,
  setErrorTitle: PropTypes.func.isRequired,
};

export default QRHardwareSignRequest;
