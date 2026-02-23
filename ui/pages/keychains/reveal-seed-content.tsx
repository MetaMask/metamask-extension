import React, { useState, useCallback } from 'react';
import qrCode from 'qrcode-generator';
import { IconName, IconColor, TextButton, Icon, ButtonVariant, Box, BoxAlignItems, BoxJustifyContent, BoxFlexDirection } from '@metamask/design-system-react';
import { Tab, Tabs } from '../../components/ui/tabs';
import RecoveryPhraseChips from '../onboarding-flow/recovery-phrase/recovery-phrase-chips';

type TabKey = 'text-seed' | 'qr-srp';

/** Minimal type for qrcode-generator instance (no @types package) */
interface QRCodeInstance {
  addData: (data: string) => void;
  make: () => void;
  createTableTag: (cellSize?: number, margin?: number) => string;
}

function createSeedQRCode(seedWords: string): QRCodeInstance {
  const qrImage = qrCode(0, 'L') as QRCodeInstance;
  qrImage.addData(seedWords);
  qrImage.make();
  return qrImage;
}

interface RevealSeedContentProps {
  seedWords: string;
  phraseRevealed: boolean;
  textTabLabel: string;
  qrTabLabel: string;
  copyButtonLabel: string;
  onRevealPhrase: () => void;
  onCopy: () => void;
  onTabClick?: (tabKey: 'text-seed' | 'qr-srp') => void;
}

export function RevealSeedContent({
  seedWords,
  phraseRevealed,
  textTabLabel,
  qrTabLabel,
  copyButtonLabel,
  onRevealPhrase,
  onCopy,
  onTabClick,
}: RevealSeedContentProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('text-seed');

  const qrHtml = React.useMemo(
    () => createSeedQRCode(seedWords).createTableTag(5, 15),
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
        <Tab name={textTabLabel} tabKey="text-seed" className="flex-1">
          <RecoveryPhraseChips
            secretRecoveryPhrase={seedWords.split(' ')}
            phraseRevealed={phraseRevealed}
            revealPhrase={onRevealPhrase}
            recoveryPhraseChipsContainerClassName="recovery-phrase-chips-container"
          />
          <TextButton
            onClick={onCopy}
            data-testid="reveal-seed-copy-button"
            className='hover:bg-transparent flex justify-center items-center w-full'
          >
            <Icon
              name={IconName.Copy}
              color={IconColor.PrimaryDefault}
              className="mr-2"
            />
            {copyButtonLabel}
          </TextButton>
        </Tab>
        <Tab name={qrTabLabel} tabKey="qr-srp" className="flex-1">
          <Box
            flexDirection={BoxFlexDirection.Row}
            justifyContent={BoxJustifyContent.Center}
            alignItems={BoxAlignItems.Center}
            data-testid="qr-srp"
          >
            <div dangerouslySetInnerHTML={{ __html: qrHtml }} />
          </Box>
        </Tab>
      </Tabs>
    </div>
  );
}
