import React from 'react';
import { Provider } from 'react-redux';
import testData from '../../../../.storybook/test-data';
import configureStore from '../../../store/store';
import BetaHeader from '.';

const store = configureStore({
  ...testData,
  metamask: { ...testData.metamask, isUnlocked: true, showBetaHeader: true },
});

export default {
  title: 'Components/App/BetaHeader',
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
};

export const DefaultStory = () => (
  <>
    <BetaHeader />
  </>
);

DefaultStory.storyName = 'Default';
