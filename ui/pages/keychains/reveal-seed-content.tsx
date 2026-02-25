import React, { useState, useCallback } from 'react';
import qrCode from 'qrcode-generator';
import {
  IconName,
  IconColor,
  TextButton,
  Icon,
  Box,
  BoxAlignItems,
  BoxJustifyContent,
  BoxFlexDirection,
  BoxBackgroundColor,
} from '@metamask/design-system-react';
import { Tab, Tabs } from '../../components/ui/tabs';
import RecoveryPhraseChips from '../onboarding-flow/recovery-phrase/recovery-phrase-chips';
import { useI18nContext } from '../../hooks/useI18nContext';

type TabKey = 'text-seed' | 'qr-srp';

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

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  for (let r = 0; r < moduleCount; r += 1) {
    for (let c = 0; c < moduleCount; c += 1) {
      const inCenter =
        r >= centerStart &&
        r < centerEnd &&
        c >= centerStart &&
        c < centerEnd;
      const isDark = !inCenter && qrImage.isDark(r, c);
      ctx.fillStyle = isDark ? '#000000' : '#ffffff';
      const x = margin + c * cell;
      const y = margin + r * cell;
      ctx.fillRect(x, y, cell, cell);
    }
  }

  return canvas.toDataURL('image/png');
}

type RevealSeedContentProps = {
  seedWords: string;
  phraseRevealed: boolean;
  onRevealPhrase: () => void;
  onCopy: () => void;
  onTabClick?: (tabKey: 'text-seed' | 'qr-srp') => void;
};

export function RevealSeedContent({
  seedWords,
  phraseRevealed,
  onRevealPhrase,
  onCopy,
  onTabClick,
}: Readonly<RevealSeedContentProps>) {
  const t = useI18nContext();
  const [activeTab, setActiveTab] = useState<TabKey>('text-seed');

  const qrDataUrl = React.useMemo(
    () => createSeedQRCodeDataUrl(seedWords),
    [seedWords],
  );

  const handleTabClick = useCallback(
    (tabKey: TabKey) => {
      setActiveTab(tabKey);
      onTabClick?.(tabKey);
    },
    [onTabClick],
  );

  return (
    <div data-testid="reveal-seed-tabs-container">
      <Tabs activeTab={activeTab} onTabClick={handleTabClick}>
        <Tab
          name={t('revealSeedWordsText')}
          tabKey="text-seed"
          className="flex-1"
        >
          <RecoveryPhraseChips
            secretRecoveryPhrase={seedWords.split(' ')}
            phraseRevealed={phraseRevealed}
            revealPhrase={onRevealPhrase}
            recoveryPhraseChipsContainerClassName="recovery-phrase-chips-container"
          />
          <TextButton
            onClick={onCopy}
            data-testid="reveal-seed-copy-button"
            className="hover:bg-transparent flex justify-center items-center w-full active:bg-transparent"
            isDisabled={!phraseRevealed}
          >
            <Icon
              name={IconName.Copy}
              color={IconColor.PrimaryDefault}
              className="mr-2"
            />
            {t('copyToClipboard')}
          </TextButton>
        </Tab>
        <Tab name={t('revealSeedWordsQR')} tabKey="qr-srp" className="flex-1">
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
              alt={t('revealSeedWordsQR')}
              role="img"
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
        </Tab>
      </Tabs>
    </div>
  );
}
