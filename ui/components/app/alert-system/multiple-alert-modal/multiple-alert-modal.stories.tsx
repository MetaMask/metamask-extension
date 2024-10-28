import React from 'react';
import { MultipleAlertModal } from './multiple-alert-modal';
import { Meta, StoryFn } from '@storybook/react';
import configureStore from '../../../../store/store';
import { Provider } from 'react-redux';
import { baseAlertsMock } from '../alert-modal/alert-modal.stories';
import { useArgs } from '@storybook/client-api';
import { Box, Button } from '../../../component-library';
import { SecurityProvider } from '../../../../../shared/constants/security-provider';
import { AlertActionHandlerProvider } from '../contexts/alertActionHandler';

const OWNER_ID_MOCK = '123';

const alertsMock = [
  baseAlertsMock[0],
  {
    ...baseAlertsMock[1],
    provider: SecurityProvider.Blockaid,
  },
  baseAlertsMock[2],
];
const storeMock = configureStore({
  confirmAlerts: {
    alerts: { [OWNER_ID_MOCK]: alertsMock },
    confirmed: {
      [OWNER_ID_MOCK]: { From: false, Data: false, Contract: false },
    },
  },
});

export default {
  title: 'Confirmations/Components/Alerts/MultipleAlertModal',
  component: MultipleAlertModal,
  argTypes: {
    alertKey: {
      control: 'text',
      description: 'The unique key representing the specific alert field .',
    },
    onActionClick: {
      action: 'onClick',
      description:
        'The function to execute a determinate action based on the action key.',
    },
    onAcknowledgeClick: {
      action: 'onClick',
      description: 'The handler for the alert modal.',
    },
    onClose: {
      action: 'onClick',
      description:
        'The function to be executed when the modal needs to be closed.',
    },
    ownerId: {
      control: 'text',
      description: 'The unique identifier of the entity that owns the alert.',
    },
  },
  args: {
    ownerId: OWNER_ID_MOCK,
  },
  decorators: [
    (story) => (
      <Provider store={storeMock}>
        <AlertActionHandlerProvider onProcessAction={(_actionKey) => {}}>
          {story()}
        </AlertActionHandlerProvider>
      </Provider>
    ),
  ],
} as Meta<typeof MultipleAlertModal>;

/**
 * Multiple Critical Alert Modal.
 */
export const TemplateStory: StoryFn<typeof MultipleAlertModal> = (args) => {
  const [{ isOpen }, updateArgs] = useArgs();
  const handleOnClick = () => {
    updateArgs({ isOpen: true });
  };
  const handleOnClose = () => {
    updateArgs({ isOpen: false });
  };
  return (
    <Box>
      {isOpen && (
        <MultipleAlertModal
          {...args}
          alertKey={'From'}
          onClose={handleOnClose}
          onFinalAcknowledgeClick={handleOnClose}
        />
      )}
      <Button onClick={handleOnClick} danger={true}>
        Open multiple alert modal
      </Button>
    </Box>
  );
};
TemplateStory.storyName = 'Multiple Critical Alert Modal';
