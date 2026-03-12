import React, { useEffect, useMemo, useState } from 'react';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import { BrowserQRCodeReader } from '@zxing/browser';
import log from 'loglevel';
import PropTypes from 'prop-types';
import { MILLISECOND } from '../../../../shared/constants/time';
import Spinner from '../../ui/spinner';

const EnhancedReader = ({ handleScan, onError }) => {
  const [canplay, setCanplay] = useState(false);
  const codeReader = useMemo(() => {
    const hint = new Map();
    hint.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
    return new BrowserQRCodeReader(hint, {
      delayBetweenScanAttempts: MILLISECOND * 100,
      delayBetweenScanSuccess: MILLISECOND * 100,
    });
  }, []);

  useEffect(() => {
    const videoElem = document.getElementById('video');
    const canplayListener = () => {
      setCanplay(true);
    };
    videoElem.addEventListener('canplay', canplayListener);

    let controls;
    codeReader
      .decodeFromVideoDevice(undefined, 'video', (result) => {
        if (result) {
          handleScan(result.getText());
        }
      })
      .then((c) => {
        controls = c;
      })
      .catch((e) => {
        log.info(e);
        if (onError) {
          onError(e);
        }
      });

    return () => {
      videoElem.removeEventListener('canplay', canplayListener);
      if (controls) {
        controls.stop();
      }
    };
  }, []);

  return (
    <div className="qr-scanner__content__video-wrapper">
      <video
        id="video"
        style={{
          display: canplay ? 'block' : 'none',
          width: '100%',
          filter: 'blur(4px)',
        }}
      />
      {canplay ? null : <Spinner />}
    </div>
  );
};

EnhancedReader.propTypes = {
  handleScan: PropTypes.func.isRequired,
  onError: PropTypes.func,
};

export default EnhancedReader;
