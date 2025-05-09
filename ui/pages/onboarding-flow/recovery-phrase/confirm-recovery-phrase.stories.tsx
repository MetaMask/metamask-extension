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
      'coast cost miracle area solid ranch supreme ticket shove input train art',
  },
};

const Template = (args) => <ConfirmRecoveryPhrase {...args} />;

export const Default = Template.bind({});
