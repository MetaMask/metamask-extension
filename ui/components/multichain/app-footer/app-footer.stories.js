import React from 'react';
import { Provider } from 'react-redux';
import testData from '../../../../.storybook/test-data';
import configureStore from '../../../store/store';
import { AppFooter } from '.';

const customNetworkData = {
  ...testData,
  activeTab: {
    id: 1111,
    title: 'Uniswap',
    origin: 'https://app.uniswap.org',
    protocol: 'https:',
    url: 'https://app.uniswap.org/',
  },
  metamask: {
    ...testData.metamask,
    providerConfig: {
      chainId: '0x1',
    },
    selectedAddress: '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4',
    subjectMetadata: {
      ...testData.metamask.subjectMetadata,
      'https://app.uniswap.org': {
        extensionId: null,
        iconUrl: 'https://app.uniswap.org/favicon.png',
        name: 'Uniswap',
        origin: 'https://app.uniswap.org',
        subjectType: 'website',
      },
    },
  },
};
const customNetworkStore = configureStore(customNetworkData);

export default {
  title: 'Components/Multichain/AppFooter',
};
export const DefaultStory = () => <AppFooter />;
DefaultStory.storyName = 'Default';

export const ConnectedStory = () => <AppFooter />;
ConnectedStory.storyName = 'Connected';
ConnectedStory.decorators = [
  (Story) => (
    <Provider store={customNetworkStore}>
      <Story />
    </Provider>
  ),
];
