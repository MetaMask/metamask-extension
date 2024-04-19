import React from 'react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import QRCodeModal from './qr-code-modal';

const mockStore = configureMockStore();
const testData = {
  metamask: {
    institutionalFeatures: {
      channelId: 'channel123',
      connectionRequest: {
        payload: 'encryptedPayload',
      },
    },
  },
};

const store = mockStore(testData);

export default {
  title: 'Components/QRCodeModal',
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
  component: QRCodeModal,
  argTypes: {
    onClose: { action: 'closed' },
    custodianName: { control: 'text' },
    custodianURL: { control: 'text' },
  },
};

const Template = (args) => <QRCodeModal {...args} />;

export const Default = Template.bind({});
Default.args = {
  custodianName: 'Test Custodian',
  custodianURL: 'http://testcustodian.com',
};

export const WithError = Template.bind({});
WithError.args = {
  ...Default.args,
  error: 'Failed to load data',
};
