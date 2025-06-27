import React from 'react';

import { useArgs } from '@storybook/client-api';
import { Button } from '../../../components/component-library';
import ConfirmSrpModal from './confirm-srp-modal';

export default {
  title: 'Pages/OnboardingFlow/RecoveryPhrase/ConfirmSrpModal',
  component: ConfirmSrpModal,
  argTypes: {
    isShowingModal: {
      control: 'boolean',
      defaultValue: true,
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: true },
      },
    },
    isError: {
      control: 'boolean',
      defaultValue: false,
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
  },
  args: {
    isShowingModal: false,
    isError: false,
  },
};

export const DefaultStory = () => {
  const [{ isShowingModal, isError }, updateArgs] = useArgs();

  return (
    <>
      <Button
        marginRight={2}
        onClick={() => updateArgs({ isShowingModal: true, isError: false })}
      >
        Open success modal
      </Button>
      <Button
        onClick={() => updateArgs({ isShowingModal: true, isError: true })}
      >
        Open error modal
      </Button>
      {isShowingModal && (
        <ConfirmSrpModal
          onContinue={() => console.log('continue')}
          onClose={() => updateArgs({ isShowingModal: false })}
          isError={isError}
        />
      )}
    </>
  );
};

DefaultStory.storyName = 'Default';
