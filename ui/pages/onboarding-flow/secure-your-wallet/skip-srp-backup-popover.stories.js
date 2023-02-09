import React from 'react';
import SkipSRPBackupPopover from './skip-srp-backup-popover';

export default {
  title: 'Pages/OnboardingFlow/SecureYourWallet/SkipSRPBackupPopover',
};

export const DefaultStory = () => {
  return (
    <div style={{ maxHeight: '2000px' }}>
      <SkipSRPBackupPopover />
    </div>
  );
};

DefaultStory.storyName = 'Default';
