import React from 'react';
import SkipSRPBackup from './skip-srp-backup-popover';

export default {
  title: 'Pages/OnboardingFlow/SecureYourWallet/SkipSRPBackupPopover',
  component: SkipSRPBackup,
};

export const DefaultStory = () => {
  return (
    <div style={{ maxHeight: '2000px' }}>
      <SkipSRPBackup />
    </div>
  );
};

DefaultStory.storyName = 'Default';
