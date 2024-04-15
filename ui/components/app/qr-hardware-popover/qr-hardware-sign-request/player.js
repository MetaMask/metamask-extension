import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode.react';
import { UR, UREncoder } from '@ngraveio/bc-ur';
import PropTypes from 'prop-types';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  AlignItems,
  Display,
  FlexDirection,
  TextAlign,
} from '../../../../helpers/constants/design-system';
import { PageContainerFooter } from '../../../ui/page-container';
import { Text, Box } from '../../../component-library';

const Player = ({ type, cbor, cancelQRHardwareSignRequest, toRead }) => {
  const t = useI18nContext();
  const urEncoder = useMemo(
    // For NGRAVE ZERO support please keep to a maximum fragment size of 200
    () => new UREncoder(new UR(Buffer.from(cbor, 'hex'), type), 200),
    [cbor, type],
  );
  const [currentQRCode, setCurrentQRCode] = useState(urEncoder.nextPart());
  useEffect(() => {
    const id = setInterval(() => {
      setCurrentQRCode(urEncoder.nextPart());
    }, 100);
    return () => {
      clearInterval(id);
    };
  }, [urEncoder]);

  return (
    <>
      <Box>
        <Text align={TextAlign.Center}>
          {t('QRHardwareSignRequestSubtitle')}
        </Text>
      </Box>
      <Box
        paddingTop={4}
        paddingBottom={4}
        display={Display.Flex}
        alignItems={AlignItems.center}
        flexDirection={FlexDirection.Column}
      >
        <div
          style={{
            padding: 20,
            backgroundColor: 'var(--qr-code-white-background)',
          }}
        >
          <QRCode value={currentQRCode.toUpperCase()} size={250} />
        </div>
      </Box>
      <Box paddingBottom={4} paddingLeft={4} paddingRight={4}>
        <Text align={TextAlign.Center}>
          {t('QRHardwareSignRequestDescription')}
        </Text>
      </Box>
      <PageContainerFooter
        onCancel={cancelQRHardwareSignRequest}
        onSubmit={toRead}
        cancelText={t('QRHardwareSignRequestCancel')}
        submitText={t('QRHardwareSignRequestGetSignature')}
        submitButtonType="confirm"
      />
    </>
  );
};

Player.propTypes = {
  type: PropTypes.string.isRequired,
  cbor: PropTypes.string.isRequired,
  cancelQRHardwareSignRequest: PropTypes.func.isRequired,
  toRead: PropTypes.func.isRequired,
};

export default Player;
