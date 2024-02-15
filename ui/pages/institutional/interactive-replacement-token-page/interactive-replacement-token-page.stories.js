import React from 'react';
import { Provider } from 'react-redux';
import { action } from '@storybook/addon-actions';
import configureStore from '../../../store/store';
import testData from '../../../../.storybook/test-data';
import InteractiveReplacementTokenPage from '.';

const address = '0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F';
const customData = {
  ...testData,
  metamask: {
    ...testData.metamask,
    modal: { props: address },
    selectedAddress: address,
    interactiveReplacementToken: {
      url: 'https://saturn-custody-ui.codefi.network/',
    },
    custodyAccountDetails: {
      [address]: { balance: '0x', custodianName: 'Jupiter' },
    },
    mmiConfiguration: {
      custodians: [
        {
          production: true,
          name: 'Jupiter',
          type: 'Jupiter',
          iconUrl: 'iconUrl',
          displayName: 'displayName',
        },
      ],
    },
    institutionalFeatures: {
      connectRequests: [
        {
          labels: [
            {
              key: 'service',
              value: 'test',
            },
          ],
          origin: 'origin',
          token: 'testToken',
          feature: 'custodian',
          service: 'Jupiter',
          environment: 'jupiter',
        },
      ],
    },
  },
};

const store = configureStore(customData);

export default {
  title: 'Pages/Institutional/InteractiveReplacementTokenPage',
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
  component: InteractiveReplacementTokenPage,
  args: {
    history: {
      push: action('history.push()'),
    },
  },
};

export const DefaultStory = (args) => (
  <InteractiveReplacementTokenPage {...args} />
);

DefaultStory.storyName = 'InteractiveReplacementTokenPage';
