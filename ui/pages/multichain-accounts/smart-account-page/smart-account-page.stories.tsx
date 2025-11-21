import React from 'react';
import { StoryObj, Meta } from '@storybook/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { SmartAccountPage } from './smart-account-page';
import { MULTICHAIN_SMART_ACCOUNT_PAGE_ROUTE } from '../../../helpers/constants/routes';
import mockState from '../../../../test/data/mock-state.json';

const mockStore = configureStore([]);
const MOCK_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';

const meta: Meta<typeof SmartAccountPage> = {
  title: 'Pages/MultichainAccounts/SmartAccountPage',
  component: SmartAccountPage,
  parameters: {
    initialEntries: ['/'],
    path: '*',
  },
};

export default meta;
type Story = StoryObj<typeof SmartAccountPage>;

export const Default: Story = {
  decorators: [
    (Story) => {
      const store = mockStore(mockState);
      return (
        <Provider store={store}>
          <Story />
        </Provider>
      );
    },
  ],
  parameters: {
    initialEntries: [
      `${MULTICHAIN_SMART_ACCOUNT_PAGE_ROUTE}/${encodeURIComponent(MOCK_ADDRESS)}`,
    ],
    path: `${MULTICHAIN_SMART_ACCOUNT_PAGE_ROUTE}/:address`,
  },
};
