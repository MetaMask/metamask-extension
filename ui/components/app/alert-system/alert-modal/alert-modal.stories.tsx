import React from 'react';
import { AlertModal } from './alert-modal';
import { Severity } from '../../../../helpers/constants/design-system';
import { Meta, StoryFn } from '@storybook/react';
import configureStore from '../../../../store/store';
import { Provider } from 'react-redux';
import { Alert } from '../../../../ducks/confirm-alerts/confirm-alerts';
import { useArgs } from '@storybook/client-api';
import { Box, Button } from '../../../component-library';

export const baseAlertsMock: Alert[] = [
  {
    key: 'From',
    field: 'From',
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
    key: 'Data',
    field: 'Data',
    severity: Severity.Warning,
    message: 'Alert 2',
    alertDetails: ['detail 1 warning', 'detail 2 warning'],
    actions: [{ key: 'go-to-gas-modal', label: 'Update gas option' }],
  },
  {
    key: 'Contract',
    field: 'Contract',
    severity: Severity.Info,
    message: 'Alert Info',
    alertDetails: ['detail 1 info', 'detail  info'],
  },
];
const ownerIdMock = '123';
const storeMock = configureStore({
  confirmAlerts: {
    alerts: { [ownerIdMock]: baseAlertsMock },
    confirmed: { [ownerIdMock]: { From: false, Data: false, Contract: false } },
  },
});

export default {
  title: 'Components/App/AlertSystem/AlertModal',
  component: AlertModal,
  argTypes: {
    ownerId: {
      control: 'text',
      description: 'The unique identifier of the entity that owns the alert.',
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
    alertKey: {
      control: 'text',
      description: 'The unique key representing the specific alert field .',
    },
  },
  args: {
    onAcknowledgeClick: () => {},
    ownerId: ownerIdMock,
  },
  decorators: [(story) => <Provider store={storeMock}>{story()}</Provider>],
  excludeStories: ['baseAlertsMock'],
} as Meta<typeof AlertModal>;

export const DefaultStory: StoryFn<typeof AlertModal> = (args) => {
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
        <AlertModal
          {...args}
          alertKey={'From'}
          onClose={handleOnClose}
          onAcknowledgeClick={handleOnClose}
        />
      )}
      <Button onClick={handleOnClick} danger={true}>
        Open alert modal
      </Button>
    </Box>
  );
};

DefaultStory.storyName = 'Critical Alert';
