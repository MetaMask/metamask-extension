import React from 'react';
import { Provider } from 'react-redux';
import testData from '../../../../.storybook/test-data';
import configureStore from '../../../store/store';
import BetaHomeHeader from './beta-home-header';

const store = configureStore({
  ...testData,
  metamask: { ...testData.metamask, isUnlocked: true, showBetaHeader: true },
});

export default {
  title: 'Components/App/BetaHomeHeader',
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
  id: __filename,
};

export const DefaultStory = () => (
  <>
    <BetaHomeHeader />
  </>
);

DefaultStory.storyName = 'Default';
