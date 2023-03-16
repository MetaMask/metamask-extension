import React from 'react';
import { Provider } from 'react-redux';
import testData from '../../../../.storybook/test-data';
import configureStore from '../../../store/store';
import { MultichainConnectedSiteMenu } from './multichain-connected-site-menu';

export default {
  title: 'Components/Multichain/MultichainConnectedSiteMenu',

  component: MultichainConnectedSiteMenu,
};
const customNetworkData = {
  ...testData,
  metamask: {
    selectedAddress: '0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5',
    subjectMetadata: {
      'peepeth.com': {
        iconUrl: 'https://peepeth.com/favicon-32x32.png',
        name: 'Peepeth',
      },
    },
    subjects: {
      'peepeth.com': {
        permissions: {
          eth_accounts: {
            caveats: [
              {
                type: 'restrictReturnedAccounts',
                value: ['0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5'],
              },
            ],
            date: 1585676177970,
            id: '840d72a0-925f-449f-830a-1aa1dd5ce151',
            invoker: 'peepeth.com',
            parentCapability: 'eth_accounts',
          },
        },
      },
    },
  },
};

const customNetworkStore = configureStore(customNetworkData);

const Template = (args) => {
  return <MultichainConnectedSiteMenu {...args} />;
};

export const DefaultStory = Template.bind({});

export const ConnectedStory = Template.bind({});

ConnectedStory.decorators = [
  (story) => <Provider store={customNetworkStore}>{story()}</Provider>,
];
