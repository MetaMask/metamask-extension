import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Box,
  Text,
  FontWeight,
  TextColor,
  TextVariant,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
  TextButton,
  Skeleton,
} from '@metamask/design-system-react';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { selectQrSyncQrPayload } from '../../../../selectors/qr-sync/qr-sync';
import { ENVIRONMENT } from '../../../../../shared/constants/build';

const QR_CODE_SIZE = 184;
const QR_CODE_INNER_SIZE = 152;

const QrCodeScan = () => {
  const t = useI18nContext();
  const qrPayload = useSelector(selectQrSyncQrPayload);
  const [isPayloadVisible, setIsPayloadVisible] = useState(false);
  const canRevealQrPayload =
    process.env.METAMASK_ENVIRONMENT === ENVIRONMENT.DEVELOPMENT ||
    process.env.METAMASK_ENVIRONMENT === ENVIRONMENT.TESTING;

  return (
    <Box flexDirection={BoxFlexDirection.Column} gap={4} className="flex-1">
      <Text
        variant={TextVariant.HeadingLg}
        color={TextColor.TextDefault}
        fontWeight={FontWeight.Bold}
      >
        {t('syncAccounts')}
      </Text>
      <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
        {t('scan_qr_code_desc')}
      </Text>
      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Center}
        marginTop={4}
        gap={4}
      >
        <Box
          className="relative inline-flex"
          justifyContent={BoxJustifyContent.Center}
          alignItems={BoxAlignItems.Center}
          data-testid={qrPayload ? 'qr-sync-qr-code' : 'qr-sync-qr-loading'}
        >
          {qrPayload ? (
            <Box className="relative self-center overflow-hidden rounded-2xl border border-muted bg-white p-4">
              <QRCodeSVG
                data-testid="qr-code-image"
                value={qrPayload}
                size={QR_CODE_INNER_SIZE}
                level="M"
                marginSize={0}
                title={t('scanQrCode')}
              />
              <Box className="absolute left-1/2 top-1/2 flex h-10 w-[45px] -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden bg-white">
                <img
                  src="images/logo/metamask-fox.svg"
                  alt=""
                  aria-hidden
                  className="h-[35px] w-[35px] object-contain"
                  data-testid="qr-code-fox"
                />
              </Box>
            </Box>
          ) : (
            <Skeleton width={QR_CODE_SIZE} height={QR_CODE_SIZE} />
          )}
        </Box>
        {canRevealQrPayload && qrPayload ? (
          <Box
            flexDirection={BoxFlexDirection.Column}
            alignItems={BoxAlignItems.Center}
            gap={2}
            className="w-full"
          >
            <TextButton
              onClick={() => setIsPayloadVisible((visible) => !visible)}
              data-testid="qr-sync-toggle-qr-payload"
              className="text-alternative hover:text-alternative active:text-alternative"
            >
              {isPayloadVisible ? t('hideQrData') : t('cantScanQrCode')}
            </TextButton>
            {isPayloadVisible ? (
              <Text
                variant={TextVariant.BodyXs}
                color={TextColor.TextAlternative}
                className="w-full max-w-[208px] break-all text-center"
                data-testid="qr-sync-qr-payload"
              >
                {qrPayload}
              </Text>
            ) : null}
          </Box>
        ) : null}
      </Box>
    </Box>
  );
};

export default QrCodeScan;
