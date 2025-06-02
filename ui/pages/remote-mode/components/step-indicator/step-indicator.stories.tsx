import React from 'react';
import StepIndicator from './step-indicator.component';

export default {
  title: 'Components/Vault/RemoteMode/StepIndicator',
  component: StepIndicator,
  parameters: {
    docs: {
      description: {
        component:
          'A component that displays the current step number and total steps in a multi-step process.',
      },
    },
  },
};

export const Default = {
  args: {
    currentStep: 1,
    totalSteps: 3,
  },
};

export const SecondStep = {
  args: {
    currentStep: 2,
    totalSteps: 3,
  },
};

export const LastStep = {
  args: {
    currentStep: 3,
    totalSteps: 3,
  },
};
