import React from 'react';
import SkipSRPBackup from './skip-srp-backup-popover';
import { StoryFn } from '@storybook/react';

export default {
  title: 'Pages/OnboardingFlow/SecureYourWallet/SkipSRPBackupPopover',
  component: SkipSRPBackup,
};

const Template: StoryFn<typeof SkipSRPBackup> = (args) => {
  return (
    <div style={{ maxHeight: '2000px' }}>
      <SkipSRPBackup {...args} />
    </div>
  );
};

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';
