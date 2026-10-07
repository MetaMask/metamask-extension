import React from 'react';
import RecoveryPhraseReminder from './recovery-phrase-reminder';

export default {
  title: 'Components/App/RecoveryPhraseReminder',

  argTypes: {
    onConfirm: {
      action: 'onConfirm',
    },
  },
  args: {
    onConfirm: () => console.log('onConfirm fired'),
  },
};

export const DefaultStory = (args) => <RecoveryPhraseReminder {...args} />;

DefaultStory.storyName = 'Default';
