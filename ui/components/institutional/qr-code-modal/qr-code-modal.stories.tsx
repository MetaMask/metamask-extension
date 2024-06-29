import React from 'react';
import { Meta, StoryFn } from '@storybook/react';
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

const meta: Meta<typeof QRCodeModal> = {
  title: 'Components/QRCodeModal',
  decorators: [
    (storyFn: any) => <Provider store={store}>{storyFn()}</Provider>,
  ],
  component: QRCodeModal,
  argTypes: {
    onClose: { action: 'closed' },
    custodianName: { control: 'text' },
    custodianURL: { control: 'text' },
  },
};

export default meta;

const Template: StoryFn<typeof QRCodeModal> = (args) => (
  <QRCodeModal {...args} />
);

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
