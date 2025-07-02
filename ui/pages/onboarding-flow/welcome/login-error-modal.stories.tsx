import React from 'react';
import { useArgs } from '@storybook/client-api';
import LoginErrorModal from './login-error-modal';
import { Button } from '../../../components/component-library';
import { LOGIN_ERROR } from './types';

export default {
  title: 'Pages/OnboardingFlow/Welcome/LoginErrorModal',
  component: LoginErrorModal,
  argTypes: {
    isShowingModal: {
      control: 'boolean',
      defaultValue: true,
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: true },
      },
    },
    loginError: {
      control: 'select',
      options: Object.values(LOGIN_ERROR),
      defaultValue: LOGIN_ERROR.GENERIC,
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: LOGIN_ERROR.GENERIC },
      },
    },
  },
};

export const DefaultStory = () => {
  const [{ isShowingModal, loginError }, updateArgs] = useArgs();

  return (
    <>
      <Button onClick={() => updateArgs({ isShowingModal: true })}>
        Open modal
      </Button>
      {isShowingModal && (
        <LoginErrorModal
          onClose={() => updateArgs({ isShowingModal: false })}
          loginError={loginError}
        />
      )}
    </>
  );
};

DefaultStory.storyName = 'Default';
