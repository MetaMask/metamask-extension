import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { Provider } from 'react-redux';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { MultichainReviewPermissions } from './multichain-review-permissions-page';

export default {
  title:
    'Components/MultichainAccounts/Permissions/MultichainReviewPermissions',
  component: MultichainReviewPermissions,
  parameters: {
    docs: {
      description: {
        component:
          'A page for reviewing and managing multichain account permissions for a connected site',
      },
    },
  },
} as Meta<typeof MultichainReviewPermissions>;

const store = configureStore({
  metamask: mockState.metamask,
  activeTab: {
    origin: 'https://test.dapp',
  },
});

const Template: StoryFn<typeof MultichainReviewPermissions> = () => (
  <Provider store={store}>
    <MultichainReviewPermissions />
  </Provider>
);

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';

export const WithConnectedAccounts = Template.bind({});
WithConnectedAccounts.storyName = 'With Connected Accounts';
WithConnectedAccounts.parameters = {
  docs: {
    description: {
      story: 'Shows the page with some connected account groups',
    },
  },
};

export const NoConnectedAccounts = Template.bind({});
NoConnectedAccounts.storyName = 'No Connected Accounts';
NoConnectedAccounts.parameters = {
  docs: {
    description: {
      story: 'Shows the page with no connected account groups',
    },
  },
};
