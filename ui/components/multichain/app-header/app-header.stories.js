import React from 'react';
import { Provider } from 'react-redux';
import configureStore from '../../../store/store';
import testData from '../../../../.storybook/test-data';
import { AppHeader } from '.';

const store = configureStore(testData);

export default {
  title: 'Components/Multichain/AppHeader',
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
  component: AppHeader,
  argTypes: {
    location: {
      control: 'object',
    },
  },
  args: {
    location: { pathname: '' },
  },
};
const customNetworkUnlockedData = {
  ...testData,
  metamask: {
    ...testData.metamask,
    preferences: {
      showTestNetworks: true,
    },
    isUnlocked: true,
    networkConfigurations: {
      ...testData.metamask.networkConfigurations,
    },
  },
};
const customNetworkUnlockedStore = configureStore(customNetworkUnlockedData);

const customNetworkLockedData = {
  ...testData,
  metamask: {
    ...testData.metamask,
    preferences: {
      showTestNetworks: true,
    },
    isUnlocked: false,
    networkConfigurations: {
      ...testData.metamask.networkConfigurations,
    },
  },
};
const customNetworkLockedStore = configureStore(customNetworkLockedData);

const Template = (args) => {
  return <AppHeader {...args} />;
};

export const FullScreenAndUnlockedStory = Template.bind({});

FullScreenAndUnlockedStory.decorators = [
  (Story) => (
    <Provider store={customNetworkUnlockedStore}>
      <Story />
    </Provider>
  ),
];

export const FullScreenAndLockedStory = Template.bind({});

FullScreenAndLockedStory.decorators = [
  (Story) => (
    <Provider store={customNetworkLockedStore}>
      <Story />
    </Provider>
  ),
];
