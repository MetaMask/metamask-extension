import React from 'react';
import CreatePassword from './create-password';

export default {
  title: 'Pages/OnboardingFlow/CreatePassword',
  argTypes: {
    createNewAccount: {
      action: 'createNewAccount',
    },
    importWithRecoveryPhrase: {
      action: 'importWithRecoveryPhrase',
    },
    secretRecoveryPhrase: {
      control: 'text',
    },
  },
};

export const DefaultStory = (args) => <CreatePassword {...args} />;

DefaultStory.storyName = 'Default';
