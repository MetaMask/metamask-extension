import React from 'react';
import { MultipleAlertModal } from './multiple-alert-modal';
import { Severity } from '../../../../../helpers/constants/design-system';
import { Meta, StoryFn } from '@storybook/react';
import configureStore from '../../../../../store/store';
import { Provider } from 'react-redux';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { useArgs } from '@storybook/client-api';
import { Box, Button } from '../../../../component-library';

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
  title: 'Confirmations/Components/Alerts/MultipleAlertModal',
  component: MultipleAlertModal,
  argTypes: {
    alertKey: {
      control: 'text',
      description: 'The unique key representing the specific alert field .',
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
  decorators: [(story) => <Provider store={storeMock}>{story()}</Provider>],
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
          alertKey={'from'}
          onClose={handleOnClose}
          onFinalAcknowledgeClick={handleOnClose}
        />
      )}
      <Button onClick={handleOnClick} danger={true}>Open multiple alert modal</Button>
    </Box>
  );
};
TemplateStory.storyName = 'Multiple Critical Alert Modal';
