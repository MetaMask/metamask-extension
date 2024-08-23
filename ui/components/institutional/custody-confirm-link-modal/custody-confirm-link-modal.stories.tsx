import React from 'react';
import { Provider } from 'react-redux';
import configureStore from '../../../store/store';
import testData from '../../../../.storybook/test-data';
import CustodyConfirmLink from '.';

const customData = {
  ...testData,
  appState: {
    ...testData.appState,
    modal: {
      modalState: {
        props: {
          link: {
            url: 'test-url',
            ethereum: {
              accounts: [{}],
            },
            text: '',
            action: '',
          },
        },
      },
    },
  },
  metamask: {
    ...testData.metamask,
    mmiConfiguration: {
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
  },
};

const store = configureStore(customData);

type CustodyConfirmLinkArgs = {
  hideModal: () => void;
};

export default {
  title: 'Components/Institutional/CustodyConfirmLink',
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
  component: CustodyConfirmLink,
  args: {},
};

export const DefaultStory = (args: CustodyConfirmLinkArgs) => (
  <CustodyConfirmLink {...args} />
);

DefaultStory.storyName = 'CustodyConfirmLink';
