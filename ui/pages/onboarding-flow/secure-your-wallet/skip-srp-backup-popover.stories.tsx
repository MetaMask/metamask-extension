import React from 'react';
import SkipSRPBackup from './skip-srp-backup-popover';

export default {
  title: 'Pages/OnboardingFlow/SecureYourWallet/SkipSRPBackup',
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
