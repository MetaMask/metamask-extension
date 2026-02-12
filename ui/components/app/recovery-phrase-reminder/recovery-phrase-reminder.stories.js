import React from 'react';
import RecoveryPhraseReminder from '.';

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
