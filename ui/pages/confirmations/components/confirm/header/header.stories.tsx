import React from 'react';
import { Provider } from 'react-redux';

import mockState from '../../../../../../test/data/mock-state.json';
import configureStore from '../../../../../store/store';

import Header from './header';

const store = configureStore({
  metamask: {
    ...mockState.metamask,
  },
  confirm: {
    currentConfirmation: {
      msgParams: {
        from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
      },
    },
  },
});

const Story = {
  title: 'Confirmations/Components/Confirm/Header',
  component: Header,
  decorators: [(story: any) => <Provider store={store}>{story()}</Provider>],
};

export default Story;

export const DefaultStory = () => <Header />;

DefaultStory.storyName = 'Default';
