import React from 'react';
import { Provider } from 'react-redux';
import { EditAccountsModal } from '.';
import testData from '../../../../.storybook/test-data';
import configureStore from '../../../store/store';

const store = configureStore(testData);

export default {
  title: 'Components/Multichain/EditAccountsModal',
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
  argTypes: {
    onClose: { action: 'onClose' },
    activeTabOrigin: { control: 'text' },
  },
  args: {
    onClose: () => undefined,
    onClick: () => undefined,
    onDisconnectClick: () => undefined,
    approvedAccounts: [],
    activeTabOrigin: 'https://test.dapp',
    currentTabHasNoAccounts: false,
  },
};

export const DefaultStory = (args) => <EditAccountsModal {...args} />;

DefaultStory.storyName = 'Default';
