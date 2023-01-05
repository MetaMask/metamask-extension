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
  frequentRpcListDetail,
  identities,
  pendingTokens,
  selectedAddress,
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
    identities: {
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
    selectedAddress: {
      control: {
        type: 'text',
      },
    },
  },
  args: {
    history: {
      push: action('history.push()'),
    },
    pendingTokens,
    tokens,
    identities,
    showSearchTab: true,
    mostRecentOverviewPage: DEFAULT_ROUTE,
    chainId: frequentRpcListDetail[0].chainId,
    rpcPrefs: frequentRpcListDetail[0].rpcPrefs,
    tokenList,
    useTokenDetection: false,
    selectedAddress,
  },
};

export const DefaultStory = (args) => {
  return <ImportToken {...args} />;
};

DefaultStory.storyName = 'Default';
