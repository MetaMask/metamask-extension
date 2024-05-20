import React from 'react';
import { ConfirmAlertModal } from './confirm-alert-modal';
import { Severity } from '../../../../../helpers/constants/design-system';
import { Meta, StoryFn } from '@storybook/react';
import configureStore from '../../../../../store/store';
import { Provider } from 'react-redux';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Box, Button } from '../../../../component-library';
import { useArgs } from '@storybook/client-api';

const ALERTS_MOCK: Alert[] = [
  {
    key: 'from',
    severity: Severity.Danger,
    message: 'Description of what may happen if this alert was ignored',
    reason: 'Reason for the alert 1',
    alertDetails: [
      'We found the contract Petname 0xEqT3b9773b1763efa556f55ccbeb20441962d82x to be malicious',
      'Operator is an externally owned account (EOA) ',
      'Operator is untrusted according to previous activity',
    ],
  },
  {
    key: 'data',
    severity: Severity.Warning,
    message: 'Alert 2',
    alertDetails: ['detail 1 warning', 'detail 2 warning'],
  },
  {
    key: 'contract',
    severity: Severity.Info,
    message: 'Alert Info',
    alertDetails: ['detail 1 info', 'detail  info'],
  },
];
const OWNER_ID_MOCK = '123';
const storeMock = configureStore({
  confirmAlerts: {
    alerts: { [OWNER_ID_MOCK]: ALERTS_MOCK },
    confirmed: {
      [OWNER_ID_MOCK]: { from: false, data: false, contract: false },
    },
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
          alertKey={'from'}
          onClose={handleOnClose}
          onCancel={handleOnClose}
          onSubmit={handleOnClose}
        />
      )}
      <Button onClick={handleOnClick} danger={true}>Open confirm alert modal</Button>
    </Box>
  );
};
TemplateStory.storyName = 'Confirm Critical Alert Modal';
