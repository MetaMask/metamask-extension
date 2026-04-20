import React, { useEffect } from 'react';
import {
  Box,
  Text,
  FontWeight,
  TextColor,
  TextVariant,
  BoxBackgroundColor,
  BoxAlignItems,
  BoxJustifyContent,
  BoxFlexDirection,
} from '@metamask/design-system-react';
import qrCode from 'qrcode-generator';
import { lightTheme } from '@metamask/design-tokens';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { AddDeviceSettingsStep } from '../constant';

type QrCodeScanProps = {
  onScanSuccess: (type: AddDeviceSettingsStep) => void;
};

/** Minimal type for qrcode-generator instance (no @types package) */
type QRCodeInstance = {
  addData: (data: string) => void;
  make: () => void;
  getModuleCount: () => number;
  isDark: (row: number, col: number) => boolean;
  createDataURL: (cellSize?: number, margin?: number) => string;
};

/** Target QR code size in pixels (width and height) for display */
const QR_SIZE = 219;
/** Scale factor for canvas (2x = sharp on retina/high-DPI) */
const QR_CANVAS_SCALE = 2;
/** Minimum margin (quiet zone) in pixels */
const QR_MIN_MARGIN = 4;
/** Number of modules to leave empty in the center (creates scannable hole for logo) */
const QR_CENTER_HOLE_MODULES = 8;

/**
 * Creates a QR code data URL with a white center cutout so the code remains
 * scannable while the logo sits in the empty space.
 * @param seedWords
 */
function createSeedQRCodeDataUrl(seedWords: string): string {
  // Use high error correction (H = 30%) so the center hole remains decodable
  const qrImage = qrCode(0, 'H') as QRCodeInstance;
  qrImage.addData(seedWords);
  qrImage.make();

  const moduleCount = qrImage.getModuleCount();
  const cellSize = Math.floor((QR_SIZE - 2 * QR_MIN_MARGIN) / moduleCount);
  const marginPx = Math.floor((QR_SIZE - moduleCount * cellSize) / 2);
  const centerStart =
    Math.floor(moduleCount / 2) - Math.floor(QR_CENTER_HOLE_MODULES / 2);
  const centerEnd = centerStart + QR_CENTER_HOLE_MODULES;

  if (typeof document === 'undefined') {
    return qrImage.createDataURL(cellSize, marginPx);
  }

  const size = QR_SIZE * QR_CANVAS_SCALE;
  const cell = cellSize * QR_CANVAS_SCALE;
  const margin = marginPx * QR_CANVAS_SCALE;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return qrImage.createDataURL(cellSize, marginPx);
  }

  const qrBackground = lightTheme.colors.background.default;
  const qrForeground = lightTheme.colors.text.default;

  ctx.fillStyle = qrBackground;
  ctx.fillRect(0, 0, size, size);

  for (let r = 0; r < moduleCount; r += 1) {
    for (let c = 0; c < moduleCount; c += 1) {
      const inCenter =
        r >= centerStart && r < centerEnd && c >= centerStart && c < centerEnd;
      const isDark = !inCenter && qrImage.isDark(r, c);
      ctx.fillStyle = isDark ? qrForeground : qrBackground;
      const x = margin + c * cell;
      const y = margin + r * cell;
      ctx.fillRect(x, y, cell, cell);
    }
  }

  return canvas.toDataURL('image/png');
}

const QrCodeScan = ({ onScanSuccess }: QrCodeScanProps) => {
  const t = useI18nContext();

  useEffect(() => {
    setTimeout(() => {
      onScanSuccess(AddDeviceSettingsStep.EnterVerificationCode);
    }, 2000);
  }, [onScanSuccess]);

  const qrDataUrl = React.useMemo(
    () => createSeedQRCodeDataUrl('metamask-device-sync'),
    [],
  );

  return (
    <Box className="p-4 pt-0 flex-1 flex-col gap-4">
      <Text
        variant={TextVariant.HeadingLg}
        className="text-[26px]"
        color={TextColor.TextDefault}
        fontWeight={FontWeight.Bold}
      >
        {t('scan_qr_code')}
      </Text>
      <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
        {t('scan_qr_code_desc')}
      </Text>
      <Box className="items-center justify-center flex-row mt-4">
        <Box
          flexDirection={BoxFlexDirection.Row}
          justifyContent={BoxJustifyContent.Center}
          alignItems={BoxAlignItems.Center}
          backgroundColor={BoxBackgroundColor.BackgroundDefault}
          data-testid="qr-srp"
          className="mt-4 relative"
        >
          <img
            src={qrDataUrl}
            alt={t('scan_qr_code')}
            width={QR_SIZE}
            height={QR_SIZE}
            className="rounded-lg"
          />
          <img
            src="images/logo/metamask-fox.svg"
            alt=""
            className="absolute top-1/2 left-1/2 w-12 h-12 object-contain -translate-x-1/2 -translate-y-1/2"
            aria-hidden
          />
        </Box>
      </Box>
    </Box>
  );
};

export default QrCodeScan;
