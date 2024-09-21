import React from 'react';
import RecoveryPhraseReminder from '.';

export default {
  title: 'Components/App/RecoveryPhraseReminder',

  argTypes: {
    hasBackedUp: {
      control: 'boolean',
    },
    onConfirm: {
      action: 'onConfirm',
    },
  },
  args: {
    hasBackedUp: false,
    onConfirm: () => console.log('onConfirm fired'),
  },
};

export const DefaultStory = (args) => <RecoveryPhraseReminder {...args} />;

DefaultStory.storyName = 'Default';
