import React from 'react';
import { Provider } from 'react-redux';
import testData from '../../../../.storybook/test-data';
import configureStore from '../../../store/store';

import DeprecatedNetworks from './deprecated-networks';

const store = configureStore({
  ...testData,
  metamask: {
    ...testData.metamask,
    completedOnboarding: true,
    providerConfig: { chainId: '0x3' },
  },
});

export default {
  title: 'Components/UI/DeprecatedNetworks',
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
};

export const DefaultStory = () => <DeprecatedNetworks />;

DefaultStory.storyName = 'Default';
