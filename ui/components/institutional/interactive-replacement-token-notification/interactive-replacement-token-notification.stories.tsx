import React from 'react';
import { Provider } from 'react-redux';
import configureStore from '../../../store/store';
import testData from '../../../../.storybook/test-data';
import InteractiveReplacementTokenNotification from '.';

const customData = {
  ...testData,
  metamask: {
    ...testData.metamask,
    isUnlocked: true,
    interactiveReplacementToken: {
      oldRefreshToken:
        '81f96a88b6cbc5f50d3864122349fa9a9755833ee82a7e3cf6f268c78aab51ab',
      url: 'url',
    },
    preferences: {
      useNativeCurrencyAsPrimaryCurrency: true,
    },
    keyrings: [
      {
        type: 'Custody - Saturn',
        accounts: ['0xca8f1F0245530118D0cf14a06b01Daf8f76Cf281'],
      },
    ],
    internalAccounts: {
      accounts: {
        'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
          address: '0xca8f1F0245530118D0cf14a06b01Daf8f76Cf281',
          id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
          metadata: {
            name: 'Test Account',
            keyring: {
              type: 'Custody - Saturn',
            },
          },
          options: {},
          methods: [],
          type: 'EOA',
        },
      },
      selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
    },
    custodyAccountDetails: {
      '0xca8f1F0245530118D0cf14a06b01Daf8f76Cf281': {
        address: '0xca8f1F0245530118D0cf14a06b01Daf8f76Cf281',
        authDetails: {
          refreshToken: 'def',
        },
        custodianName: 'saturn-dev',
      },
    },
  },
};

const store = configureStore(customData);

export default {
  title: 'Components/Institutional/InteractiveReplacementToken-Notification',
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
  component: InteractiveReplacementTokenNotification,
  args: {
    isVisible: true,
  },
  argTypes: {
    onClick: {
      action: 'onClick',
    },
  },
};

type InteractiveReplacementTokenNotificationArgs = {
  isVisible?: boolean;
};

export const DefaultStory = (
  args: InteractiveReplacementTokenNotificationArgs,
) => <InteractiveReplacementTokenNotification {...args} />;

DefaultStory.storyName = 'InteractiveReplacementTokenNotification';
