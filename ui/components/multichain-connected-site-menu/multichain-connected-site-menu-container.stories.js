import React from 'react';
import { Provider } from 'react-redux';
import testData from '../../../.storybook/test-data';
import configureStore from '../../store/store';
import { MultichainConnectedSiteMenu } from './multichain-connected-site-menu.component';

export default {
  title: 'Components/UI/MultichainConnectedSiteMenu',

  component: MultichainConnectedSiteMenu,
};
const customNetworkData = {
  ...testData,
  metamask: {
    ...testData.metamask,
    connectedSubjects: [
      {
        extensionId: null,
        origin: 'https://metamask.github.io',
        name: 'MetaMask < = > Ledger Bridge',
        iconUrl: null,
      },
    ],
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
