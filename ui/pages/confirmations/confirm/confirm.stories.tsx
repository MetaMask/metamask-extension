import React from 'react';
import { Provider } from 'react-redux';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import ConfirmPage from './confirm';

const store = configureStore({
  confirm: {
    currentConfirmation: {
      type: 'personal_sign',
    },
  },
  metamask: {
    ...mockState.metamask,
  },
});

const ConfirmPageStory = {
  title: 'Pages/Confirm/ConfirmPage',
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
};

export const DefaultStory = (args) => <ConfirmPage {...args} />;

DefaultStory.storyName = 'Default';

export default ConfirmPageStory;
