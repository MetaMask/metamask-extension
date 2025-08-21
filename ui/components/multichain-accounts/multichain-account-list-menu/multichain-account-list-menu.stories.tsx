import React from 'react';
import { MultichainAccountListMenu } from './index';
import { MultichainAccountListMenuProps } from './multichain-account-list-menu';
import mockState from '../../../../test/data/mock-state.json';
import configureStore from '../../../store/store';
import { Provider } from 'react-redux';

const store = configureStore(mockState);

export default {
  title: 'Components/MultichainAccounts/MultichainAccountListMenu',
  component: MultichainAccountListMenu,
  argTypes: {
    onClose: {
      action: 'onClose',
    },
  },
  decorators: [(story: any) => <Provider store={store}>{story()}</Provider>],
};

export const DefaultStory = (args: MultichainAccountListMenuProps) => (
  <MultichainAccountListMenu {...args} />
);
