import React from 'react';
import { Provider } from 'react-redux';
import configureStore from '../../../store/store';
import testData from '../../../../.storybook/test-data';
import InteractiveReplacementTokenNotification from '.';

const customData = {
  ...testData,
  metamask: {
    ...testData.metamask,
    providerConfig: {
      type: 'test',
    },
    selectedAddress: '0xca8f1F0245530118D0cf14a06b01Daf8f76Cf281',
    identities: {
      '0xca8f1F0245530118D0cf14a06b01Daf8f76Cf281': {
        address: '0xca8f1F0245530118D0cf14a06b01Daf8f76Cf281',
        name: 'Custodian A',
      },
    },
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

export const DefaultStory = (args) => (
  <InteractiveReplacementTokenNotification {...args} />
);

DefaultStory.storyName = 'InteractiveReplacementTokenNotification';
