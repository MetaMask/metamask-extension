import React from 'react';
import { Provider } from 'react-redux';
import configureStore from '../../../store/store';
import testData from '../../../../.storybook/test-data';
import InteractiveReplacementTokenModal from '.';

const customData = {
  ...testData,
  metamask: {
    ...testData.metamask,
    mmiConfiguration: {
      portfolio: {
        enabled: true,
        url: 'https://dev.metamask-institutional.io/',
      },
      features: {
        websocketApi: true,
      },
      custodians: [
        {
          refreshTokenUrl:
            'https://saturn-custody.dev.metamask-institutional.io/oauth/token',
          name: 'saturn-dev',
          displayName: 'Saturn Custody',
          enabled: true,
          mmiApiUrl: 'https://api.dev.metamask-institutional.io/v1',
          websocketApiUrl:
            'wss://websocket.dev.metamask-institutional.io/v1/ws',
          apiBaseUrl:
            'https://saturn-custody.dev.metamask-institutional.io/eth',
          iconUrl:
            'https://saturn-custody-ui.dev.metamask-institutional.io/saturn.svg',
          isNoteToTraderSupported: true,
        },
      ],
    },
    custodyAccountDetails: {
      '0xAddress': {
        address: '0xAddress',
        details: 'details',
        custodyType: 'testCustody - Saturn',
        custodianName: 'saturn-dev',
      },
    },
    isUnlocked: true,
    interactiveReplacementToken: {
      oldRefreshToken: 'abc',
      url: 'https://saturn-custody-ui.dev.metamask-institutional.io',
    },
    preferences: {
      useNativeCurrencyAsPrimaryCurrency: true,
    },
  },
};

const store = configureStore(customData);

export default {
  title: 'Components/Institutional/InteractiveReplacementToken-Modal',
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
  component: InteractiveReplacementTokenModal,
};

export const DefaultStory = (args) => (
  <InteractiveReplacementTokenModal {...args} />
);

DefaultStory.storyName = 'InteractiveReplacementTokenModal';
