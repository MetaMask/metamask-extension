import React from 'react';
import { ConfirmInfoRow, ConfirmInfoRowVariant } from './row';
import { Severity } from '../../../../../helpers/constants/design-system';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import configureStore from '../../../../../store/store';
import { Provider } from 'react-redux';
import { Meta } from '@storybook/react';

const alertsMock: Alert[] = [
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
  { key: 'Data', field: 'Data', severity: Severity.Warning, message: 'Alert 2', alertDetails:['detail 1 warning', 'detail 2 warning'] },
  { key: 'Contract', field: 'Contract', severity: Severity.Info, message: 'Alert Info', alertDetails:['detail 1 info', 'detail  info'] },
];
const ownerIdMock = '123';
const storeMock = configureStore({
  confirmAlerts: {
    alerts: { [ownerIdMock]: alertsMock },
    confirmed: { [ownerIdMock]: { 'From': false, 'Data': false, 'Contract': false } },
  },
  confirm: {
    currentConfirmation: {
      id: ownerIdMock,
      status: 'unapproved',
      time: new Date().getTime(),
      type: 'json_request',
    },
  },
});

const ConfirmInfoRowStory = {
  title: 'Components/App/Confirm/InfoRow',

  component: ConfirmInfoRow,
  argTypes: {
    variant: {
      control: 'select',
      options: Object.values(ConfirmInfoRowVariant),
    },
    label: {
      control: 'text',
    },
    children: {
      control: 'text',
    },
  },
  decorators: [(story) => <Provider store={storeMock}>{story()}</Provider>],
} as Meta<typeof ConfirmInfoRow>;

export const DefaultStory = (args) => <ConfirmInfoRow {...args} />;

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  label: 'Key',
  children: 'Value',
};

export default ConfirmInfoRowStory;

/**
 * Row with Critical Alert.
 */
export const AlertRowCritical = DefaultStory.bind({});
AlertRowCritical.args = {
  label: 'From',
  children: 'Value',
  alertKey: 'From',
  variant: ConfirmInfoRowVariant.Critical,
};

/**
 * Row with Non-Critical Alert.
 */
export const AlertRowWarning = DefaultStory.bind({});
AlertRowWarning.args = {
  label: 'Data',
  children: 'Value',
  alertKey: 'Data',
  variant: ConfirmInfoRowVariant.Warning,
};

/**
 * Row with Informative Alert.
 */
export const AlertRowInformative = DefaultStory.bind({});
AlertRowInformative.args = {
  label: 'Contract',
  children: 'Value',
  alertKey: 'Contract',
};
