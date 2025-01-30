import React, { useState } from 'react';
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

export const ConfirmPhase = (args) => {
  const splitSecretRecoveryPhrase = args.secretRecoveryPhrase;
  const indicesToCheck = [2, 3, 7];

  // Removes seed phrase words from chips corresponding to the
  // indicesToCheck so that user has to complete the phrase and confirm
  // they have saved it.
  const initializePhraseElements = () => {
    const phraseElements = { ...splitSecretRecoveryPhrase };
    indicesToCheck.forEach((i) => {
      phraseElements[i] = '';
    });
    return phraseElements;
  };
  const [phraseElements, setPhraseElements] = useState(
    initializePhraseElements(),
  );

  const handleSetPhraseElements = (values) => {
    setPhraseElements(values);
  };
  return (
    <RecoveryPhraseChips
      {...args}
      secretRecoveryPhrase={splitSecretRecoveryPhrase}
      setInputValue={handleSetPhraseElements}
      inputValue={phraseElements}
      indicesToCheck={indicesToCheck}
    />
  );
};
ConfirmPhase.args = {
  confirmPhase: true,
};
