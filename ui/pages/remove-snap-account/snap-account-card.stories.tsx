import React from 'react';
import { Provider } from 'react-redux';
import configureStore from '../../store/store';
import testData from '../../../.storybook/test-data';
import { SnapAccountCard } from './snap-account-card';

const store = configureStore(testData);

const storeWithPrivacyMode = configureStore({
  ...testData,
  metamask: {
    ...testData.metamask,
    preferences: {
      privacyMode: true,
    },
  },
});

const TEST_ADDRESS = '0xde939393DDe455081fFb3Dfd027E189919F04BD0';

export default {
  title: 'Components/UI/SnapAccountCard',
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
};

export const DefaultStory = () => (
  <SnapAccountCard address={TEST_ADDRESS} />
);
DefaultStory.storyName = 'Default';

export const RemoveStory = () => (
  <SnapAccountCard address={TEST_ADDRESS} remove={true} />
);
RemoveStory.storyName = 'Remove Mode';

export const WithPrivacyModeStory = () => (
  <Provider store={storeWithPrivacyMode}>
    <SnapAccountCard address={TEST_ADDRESS} />
  </Provider>
);
WithPrivacyModeStory.storyName = 'With Privacy Mode';
