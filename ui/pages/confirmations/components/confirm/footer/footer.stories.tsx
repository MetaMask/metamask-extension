import React from 'react';
import { Provider } from 'react-redux';

import mockState from '../../../../../../test/data/mock-state.json';
import configureStore from '../../../../../store/store';

import Footer from './footer';

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
  title: 'Confirmations/Components/Confirm/Footer',
  component: Footer,
  decorators: [(story: any) => <Provider store={store}>{story()}</Provider>],
};

export default Story;

export const DefaultStory = () => <Footer />;

DefaultStory.storyName = 'Default';
