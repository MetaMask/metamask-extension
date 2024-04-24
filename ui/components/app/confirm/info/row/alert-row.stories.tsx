import React from 'react';
import { ConfirmInfoRowVariant } from './row';
import { AlertRow } from './alert-row';
import configureStore from '../../../../../store/store';
import { Provider } from 'react-redux';
import { Meta } from '@storybook/react';
import { baseAlertsMock } from '../../../confirmations/alerts/alert-modal/alert-modal.stories';

const LABEL_FROM_MOCK = 'From';
const OWNER_ID_MOCK = '123';

const pendingApprovalMock = {
  id: OWNER_ID_MOCK,
  status: 'unapproved',
  time: new Date().getTime(),
  type: 'personal_sign',
}
const storeMock = configureStore({
  metamask: {
  pendingApprovals:{
    [OWNER_ID_MOCK]: pendingApprovalMock
  }
},
confirmAlerts: {
  alerts: { [OWNER_ID_MOCK]: baseAlertsMock },
  confirmed: { [OWNER_ID_MOCK]: { [LABEL_FROM_MOCK]: false, 'Data': false, 'Contract': false } },
},
confirm: {
  currentConfirmation: pendingApprovalMock,
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
  ownerId: OWNER_ID_MOCK,
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
  ownerId: OWNER_ID_MOCK,
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
  ownerId: OWNER_ID_MOCK,
};
