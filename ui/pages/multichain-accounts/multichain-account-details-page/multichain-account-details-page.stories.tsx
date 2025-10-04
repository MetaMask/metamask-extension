import React from 'react';
import { StoryObj, Meta } from '@storybook/react';
import { Provider } from 'react-redux';
import { MultichainAccountDetailsPage } from './multichain-account-details-page';
import mockState from '../../../../test/data/mock-state.json';
import configureStore from '../../../store/store';

const store = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

const accountId = 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0';
const meta: Meta<typeof MultichainAccountDetailsPage> = {
  title: 'Pages/MultichainAccounts/MultichainAccountDetailsPage',
  component: MultichainAccountDetailsPage,
  decorators: [
    (story) => (
      <Provider store={store}>
        {story()}
      </Provider>
    ),
  ],
  parameters: {
    backgrounds: {
      default: 'light',
    },
    initialEntries: [ `/multichain-account-details/${encodeURIComponent(accountId)}`],
    path: '/multichain-account-details/:id'
  },
};

export default meta;
type Story = StoryObj<typeof MultichainAccountDetailsPage>;

export const Default: Story = {};

Default.parameters = {
  docs: {
    description: {
      story:
        'Default state of the MultichainAccountDetailsPage showing account details for the selected account.',
    },
  },
};
