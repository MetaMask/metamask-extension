import React from 'react';
import SkipSRPBackup from './skip-srp-backup-popover';

export default {
  title: 'Pages/OnboardingFlow/SecureYourWallet/SkipSrpBackupPopover',
  component: SkipSRPBackup,
};

export const DefaultStory = () => {
  return (
    <div style={{ maxHeight: '2000px' }}>
      <SkipSRPBackup onClose={() => {}} secureYourWallet={() => {}} />
    </div>
  );
};

DefaultStory.storyName = 'Default';
