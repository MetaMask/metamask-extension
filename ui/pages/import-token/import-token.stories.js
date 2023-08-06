import React from 'react';

import { Provider } from 'react-redux';
import { action } from '@storybook/addon-actions';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import configureStore from '../../store/store';
import testData from '../../../.storybook/test-data';
import ImportToken from './import-token.component';
import README from './README.mdx';

const store = configureStore(testData);
const { metamask } = store.getState();

const {
  networkConfigurations,
  internalAccounts,
  pendingTokens,
  tokenList,
  tokens,
} = metamask;

export default {
  title: 'Pages/ImportToken',

  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
  component: ImportToken,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    history: {
      control: {
        type: 'object',
      },
    },
    setPendingTokens: {
      action: 'setPendingTokens',
    },
    pendingTokens: {
      control: {
        type: 'object',
      },
    },
    clearPendingTokens: {
      action: 'clearPendingTokens',
    },
    tokens: {
      control: {
        type: 'object',
      },
    },
    accounts: {
      control: {
        type: 'object',
      },
    },
    showSearchTab: {
      control: {
        type: 'boolean',
      },
    },
    mostRecentOverviewPage: {
      control: {
        type: 'text',
      },
    },
    chainId: {
      control: {
        type: 'text',
      },
    },
    rpcPrefs: {
      control: {
        type: 'object',
      },
    },
    tokenList: {
      control: {
        type: 'object',
      },
    },
    useTokenDetection: {
      control: {
        type: 'boolean',
      },
    },
    getTokenStandardAndDetails: {
      action: 'getTokenStandardAndDetails',
    },
    selectedAccount: {
      control: {
        type: 'object',
      },
    },
  },
  args: {
    history: {
      push: action('history.push()'),
    },
    pendingTokens,
    tokens,
    accounts: Object.values(internalAccounts.accounts),
    showSearchTab: true,
    mostRecentOverviewPage: DEFAULT_ROUTE,
    chainId: networkConfigurations['test-networkConfigurationId-1'].chainId,
    rpcPrefs: networkConfigurations['test-networkConfigurationId-1'].rpcPrefs,
    tokenList,
    useTokenDetection: false,
    selectedAccount:
      internalAccounts.accounts[internalAccounts.selectedAccount],
  },
};

export const DefaultStory = (args) => {
  return <ImportToken {...args} />;
};

DefaultStory.storyName = 'Default';
