import React from 'react';
import RecoveryPhraseChips from './recovery-phrase-chips';

// Define the stories
export default {
  title: 'Pages/OnboardingFlow/RecoveryPhrase/RecoveryPhraseChips',
  component: RecoveryPhraseChips,
  argTypes: {
    secretRecoveryPhrase: {
      control: { type: 'array' },
    },
    phraseRevealed: {
      control: { type: 'boolean' },
    },
    confirmPhase: {
      control: { type: 'boolean' },
    },
    setInputValue: {
      control: { type: 'text' },
    },
    inputValue: {
      control: { type: 'text' },
    },
    indicesToCheck: {
      control: { type: 'array' },
    },
    hiddenPhrase: {
      control: { type: 'text' },
    },
  },
  args: {
    secretRecoveryPhrase: [
      'apple',
      'banana',
      'cherry',
      'date',
      'elderberry',
      'fig',
      'grape',
      'honeydew',
      'kiwi',
      'lemon',
      'mango',
      'nectarine',
    ],
  },
};

const Template = (args) => <RecoveryPhraseChips {...args} />;

export const Default = Template.bind({});
Default.args = {
  phraseRevealed: false,
};

export const PhraseRevealed = Template.bind({});
