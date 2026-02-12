import React from 'react';
import { ConfirmAlertModal } from './confirm-alert-modal';
import { Meta, StoryFn } from '@storybook/react';
import configureStore from '../../../../store/store';
import { Provider } from 'react-redux';
import { Box, Button } from '../../../component-library';
import { useArgs } from '@storybook/client-api';
import { baseAlertsMock } from '../alert-modal/alert-modal.stories';

const OWNER_ID_MOCK = '123';

const alertsMock = [
  baseAlertsMock[0],
  {
    ...baseAlertsMock[1],
    actions: undefined,
  },
  baseAlertsMock[2],
];
const storeMock = configureStore({
  confirmAlerts: {
    alerts: { [OWNER_ID_MOCK]: alertsMock },
    confirmed: { [OWNER_ID_MOCK]: { From: true, Data: true, Contract: true } },
  },
});

export default {
  title: 'Confirmations/Components/Alerts/ConfirmAlertModal',
  component: ConfirmAlertModal,
  argTypes: {
    alertKey: {
      control: 'text',
      description: 'The unique key identifying the specific alert.',
    },
    onAcknowledgeClick: {
      action: 'acknowledged',
      description:
        'Callback function invoked when the acknowledge action is triggered.',
    },
    onClose: {
      action: 'closed',
      description:
        'Callback function invoked when the modal is requested to close.',
    },
    ownerId: {
      control: 'text',
      description:
        'The owner ID of the relevant alert from the `confirmAlerts` reducer.',
    },
    onAlertLinkClick: {
      action: 'alertLinkClicked',
      description: 'Callback function called when the alert link is clicked.',
    },
    onCancel: {
      action: 'cancelled',
      description:
        'Callback function called when the cancel button is clicked.',
    },
    onSubmit: {
      action: 'submitted',
      description:
        'Callback function called when the submit button is clicked.',
    },
  },
  args: {
    onAcknowledgeClick: () => {},
    onClose: () => {},
    ownerId: OWNER_ID_MOCK,
  },
  decorators: [(story) => <Provider store={storeMock}>{story()}</Provider>],
} as Meta<typeof ConfirmAlertModal>;

export const TemplateStory: StoryFn<typeof ConfirmAlertModal> = (args) => {
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
        <ConfirmAlertModal
          {...args}
          onClose={handleOnClose}
          onCancel={handleOnClose}
          onSubmit={handleOnClose}
        />
      )}
      <Button onClick={handleOnClick} danger={true}>
        Open confirm alert modal
      </Button>
    </Box>
  );
};
TemplateStory.storyName = 'Confirm Critical Alert Modal';
