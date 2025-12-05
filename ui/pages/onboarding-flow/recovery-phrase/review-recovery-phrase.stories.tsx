import React from 'react';
import RecoveryPhrase from './review-recovery-phrase';

export default {
  title: 'Pages/OnboardingFlow/RecoveryPhrase/ReviewRecoveryPhrase',
  component: RecoveryPhrase,
  argTypes: {
    secretRecoveryPhrase: {
      control: { type: 'array' },
    },
  },
  args: {
    secretRecoveryPhrase:
      'debris dizzy just program just float decrease vacant alarm reduce speak stadium',
  },
};

const Template = (args) => <RecoveryPhrase {...args} />;

export const Default = Template.bind({});
