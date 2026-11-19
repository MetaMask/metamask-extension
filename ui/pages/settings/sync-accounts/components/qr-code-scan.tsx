import React, { useMemo, useState } from 'react';
import qrCode from 'qrcode-generator';
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
} from '@metamask/design-system-react';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { Skeleton } from '../../../../components/component-library/skeleton';
import {
  selectQrSyncExpiresAt,
  selectQrSyncQrPayload,
} from '../../../../selectors/qr-sync/qr-sync';
import { ENVIRONMENT } from '../../../../../shared/constants/build';
import { useQrSyncCountdown } from '../hooks/use-qr-sync-countdown';

/** Minimal type for qrcode-generator instance (no @types package) */
type QRCodeInstance = {
  addData: (data: string) => void;
  make: () => void;
  createDataURL: (cellSize?: number, margin?: number) => string;
};

const QR_CODE_CELL_SIZE = 5;
const QR_CODE_MARGIN = 16;
const QR_CODE_SIZE = 340;

type QrCodeScanProps = {
  onRestart: () => void;
};

const QrCodeScan = ({ onRestart }: QrCodeScanProps) => {
  const t = useI18nContext();
  const qrPayload = useSelector(selectQrSyncQrPayload);
  const expiresAt = useSelector(selectQrSyncExpiresAt);
  const secondsLeft = useQrSyncCountdown(expiresAt);
  const [lastQrPayload, setLastQrPayload] = useState<string | null>(null);

  if (qrPayload && qrPayload !== lastQrPayload) {
    setLastQrPayload(qrPayload);
  }

  const displayedPayload = qrPayload ?? lastQrPayload;
  const qrDataUrl = useMemo(() => {
    if (!displayedPayload) {
      return null;
    }
    const qrImage = qrCode(0, 'M') as QRCodeInstance;
    qrImage.addData(displayedPayload);
    qrImage.make();
    return qrImage.createDataURL(QR_CODE_CELL_SIZE, QR_CODE_MARGIN);
  }, [displayedPayload]);
  const isExpired = secondsLeft === 0;
  const shouldDimQr = isExpired;

  const renderResetBlock = (message: string) => (
    <Box
      flexDirection={BoxFlexDirection.Column}
      alignItems={BoxAlignItems.Center}
      gap={1}
    >
      <Text variant={TextVariant.BodyMd} color={TextColor.ErrorDefault}>
        {message}
      </Text>
      <TextButton
        data-testid="qr-sync-generate-new-qr-code"
        onClick={onRestart}
      >
        {t('generateNewQrCode')}
      </TextButton>
    </Box>
  );

  let statusContent = null;
  if (isExpired) {
    statusContent = renderResetBlock(t('qrCodeExpired'));
  } else if (secondsLeft !== null) {
    statusContent = (
      <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
        {t('qrCodeExpiresIn', [secondsLeft])}
      </Text>
    );
  }

  return (
    <Box flexDirection={BoxFlexDirection.Column} gap={4} className="flex-1">
      <Text
        variant={TextVariant.HeadingLg}
        color={TextColor.TextDefault}
        fontWeight={FontWeight.Bold}
      >
        {t('scanQrCode')}
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
          style={{
            opacity: shouldDimQr ? 0.3 : 1,
            filter: shouldDimQr ? 'blur(4px)' : 'none',
          }}
          data-testid={qrPayload ? 'qr-sync-qr-code' : 'qr-sync-qr-loading'}
        >
          {qrDataUrl ? (
            <>
              <img
                data-testid="qr-code-image"
                src={qrDataUrl}
                alt={t('scanQrCode')}
                width={QR_CODE_SIZE}
                height={QR_CODE_SIZE}
                className="rounded-2xl"
              />
              <Box
                // Background must remain white regardless of theme
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg flex overflow-hidden"
                justifyContent={BoxJustifyContent.Center}
                alignItems={BoxAlignItems.Center}
                style={{ height: 40, width: 45 }}
              >
                <img
                  src="images/logo/metamask-fox.svg"
                  alt="Logo"
                  width={35}
                  height={35}
                />
              </Box>
            </>
          ) : (
            <Skeleton width={QR_CODE_SIZE} height={QR_CODE_SIZE} />
          )}
        </Box>
        {process.env.METAMASK_ENVIRONMENT === ENVIRONMENT.DEVELOPMENT &&
        qrPayload ? (
          <Text
            variant={TextVariant.BodyXs}
            color={TextColor.TextAlternative}
            className="w-full text-center"
            style={{
              maxWidth: QR_CODE_SIZE,
              overflowWrap: 'anywhere',
            }}
            data-testid="qr-sync-qr-payload"
          >
            {qrPayload}
          </Text>
        ) : null}
        {statusContent}
      </Box>
    </Box>
  );
};

export default QrCodeScan;
