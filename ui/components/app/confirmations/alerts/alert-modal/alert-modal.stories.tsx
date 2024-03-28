import React from 'react';
import { AlertModal } from './alert-modal';
import { Severity } from '../../../../../helpers/constants/design-system';
import { Meta } from '@storybook/react';
import configureStore from '../../../../../store/store';
import { Provider } from 'react-redux';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';

const alertsMock: Alert[] = [
  { key: 'from', severity: Severity.Danger, message: 'Description of what may happen if this alert was ignored', reason: 'Reason for the alert 1', alertDetails: ['We found the contract Petname 0xEqT3b9773b1763efa556f55ccbeb20441962d82x to be malicious',
  'Operator is an externally owned account (EOA) ',
  'Operator is untrusted according to previous activity',]},
  { key: 'data', severity: Severity.Warning, message: 'Alert 2', alertDetails:['detail 1 warning', 'detail 2 warning'] },
  { key: 'contract', severity: Severity.Info, message: 'Alert Info', alertDetails:['detail 1 info', 'detail  info'] },
];
const ownerIdMock = '123';
const storeMock = configureStore({ confirmAlerts: {
  alerts: {[ownerIdMock]: alertsMock},
  confirmed: {[ownerIdMock]: {'from': false, 'data': false, 'contract': false}},
  } });

export default {
  title: 'Confirmations/Components/Alerts/AlertModal',
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
      description: 'The function to be executed when the modal needs to be closed.',
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
} as Meta<typeof AlertModal>;

export const DefaultStory = (args) => {
  return <AlertModal alertKey={'from'} {...args} />;
};

DefaultStory.storyName = 'Critical Alert';
