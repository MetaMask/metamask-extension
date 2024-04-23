import React from 'react';
import { ConfirmInfoRow, ConfirmInfoRowVariant } from './row';
import { AlertRow, AlertRowProps } from './alert-row';
import { Severity } from '../../../../../helpers/constants/design-system';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import configureStore from '../../../../../store/store';
import { Provider } from 'react-redux';
import { Meta } from '@storybook/react';

const LABEL_FROM_MOCK = 'From';
const alertsMock: Alert[] = [
  {
    key: LABEL_FROM_MOCK,
    field: LABEL_FROM_MOCK,
    severity: Severity.Danger,
    message: 'Description of what may happen if this alert was ignored',
    reason: 'Reason for the alert 1',
    alertDetails: [
      'We found the contract Petname 0xEqT3b9773b1763efa556f55ccbeb20441962d82x to be malicious',
      'Operator is an externally owned account (EOA) ',
      'Operator is untrusted according to previous activity',
    ],
  },
];
const OWNER_ID_MOCK = '123';
const storeMock = configureStore({
  confirmAlerts: {
    alerts: { [OWNER_ID_MOCK]: alertsMock },
    confirmed: { [OWNER_ID_MOCK]: { [LABEL_FROM_MOCK]: false, 'data': false, 'contract': false } },
  },
  confirm: {
    currentConfirmation: {
      id: OWNER_ID_MOCK,
      status: 'unapproved',
      time: new Date().getTime(),
      type: 'json_request',
    },
  },
});

const ConfirmInfoRowStory = {
  title: 'Components/App/Confirm/AlertRow',

  component: AlertRow,
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
} as Meta<typeof AlertRow>;

export const DefaultStory = (args) => <AlertRow {...args} />;

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
  label: LABEL_FROM_MOCK,
  children: 'Value',
  alertKey: LABEL_FROM_MOCK,
  alertOwnerId: OWNER_ID_MOCK,
  variant: ConfirmInfoRowVariant.Critical,
};

/**
 * Row with Non-Critical Alert.
 */
export const AlertRowWarning = DefaultStory.bind({});
AlertRowWarning.args = {
  label: LABEL_FROM_MOCK,
  children: 'Value',
  alertKey: LABEL_FROM_MOCK,
  alertOwnerId: OWNER_ID_MOCK,
  variant: ConfirmInfoRowVariant.Warning,
};

/**
 * Row with Informative Alert.
 */
export const AlertRowInformative = DefaultStory.bind({});
AlertRowInformative.args = {
  label: LABEL_FROM_MOCK,
  children: 'Value',
  alertKey: LABEL_FROM_MOCK,
  alertOwnerId: OWNER_ID_MOCK,
};
