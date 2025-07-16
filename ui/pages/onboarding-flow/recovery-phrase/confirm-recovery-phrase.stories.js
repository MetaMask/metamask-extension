import React from 'react';

import ConfirmRecoveryPhrase from './confirm-recovery-phrase';

export default {
  title: 'Pages/OnboardingFlow/RecoveryPhrase/ConfirmRecoveryPhrase',
  component: ConfirmRecoveryPhrase,
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

const Template = (args) => <ConfirmRecoveryPhrase {...args} />;

export const Default = Template.bind({});
