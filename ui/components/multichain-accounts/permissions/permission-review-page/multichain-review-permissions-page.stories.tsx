import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route } from 'react-router-dom';
import {
  Caip25EndowmentPermissionName,
  Caip25CaveatType,
} from '@metamask/chain-agnostic-permission';
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

// Create different store configurations for different scenarios
const createStoreWithState = (stateOverrides = {}) => {
  return configureStore({
    metamask: {
      ...mockState.metamask,
      ...stateOverrides,
    },
    activeTab: {
      origin: 'https://test.dapp',
    },
  });
};

// State with one connected account group
const storeWithOneAccount = createStoreWithState({
  // Add CAIP-25 permissions for the test site to make one account group connected
  subjects: {
    'https://test.dapp': {
      origin: 'https://test.dapp',
      permissions: {
        [Caip25EndowmentPermissionName]: {
          caveats: [
            {
              type: Caip25CaveatType,
              value: {
                requiredScopes: {
                  'eip155:1': {
                    accounts: [
                      'eip155:1:0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
                    ],
                  },
                },
                optionalScopes: {},
                sessionProperties: {},
                isMultichainOrigin: false,
              },
            },
          ],
          date: Date.now(),
          parentCapability: Caip25EndowmentPermissionName,
        },
      },
    },
  },
  subjectMetadata: {
    'https://test.dapp': {
      name: 'Test DApp',
      iconUrl: 'https://test.dapp/favicon.ico',
      subjectType: 'website',
      extensionId: null,
    },
  },
});

// State with no connected accounts
const storeWithNoAccounts = createStoreWithState({
  subjects: {},
  subjectMetadata: {},
});

const Template: StoryFn<{ store: any; origin: string }> = (args) => (
  <Provider store={args.store}>
    <MemoryRouter
      initialEntries={[
        `/review-permissions/${encodeURIComponent(args.origin)}`,
      ]}
    >
      <Route path="/review-permissions/:origin">
        <MultichainReviewPermissions />
      </Route>
    </MemoryRouter>
  </Provider>
);

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';
DefaultStory.args = {
  store: storeWithNoAccounts,
  origin: 'https://test.dapp',
};

export const WithOneConnectedAccount = Template.bind({});
WithOneConnectedAccount.storyName = 'With One Connected Account';
WithOneConnectedAccount.args = {
  store: storeWithOneAccount,
  origin: 'https://test.dapp',
};
WithOneConnectedAccount.parameters = {
  docs: {
    description: {
      story: 'Shows the page with one connected account group',
    },
  },
};

export const NoConnectedAccounts = Template.bind({});
NoConnectedAccounts.storyName = 'No Connected Accounts';
NoConnectedAccounts.args = {
  store: storeWithNoAccounts,
  origin: 'https://test.dapp',
};
NoConnectedAccounts.parameters = {
  docs: {
    description: {
      story: 'Shows the page with no connected account groups',
    },
  },
};
