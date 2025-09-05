import React from 'react';
import { Provider } from 'react-redux';

import configureStore from '../../../../../store/store';
import mockState from '../../../../../../test/data/mock-state.json';
import OriginThrottleModal from './origin-throttle-modal';

const store = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

const Story = {
  title: 'Pages/Confirmations/Components/Confirm/Footer/OriginThrottleModal',
  component: OriginThrottleModal,
  decorators: [
    (story) => {
      return <Provider store={store}>{story()}</Provider>;
    },
  ],
};

export default Story;

export const DefaultStory = () => (
  <OriginThrottleModal isOpen={true} onConfirmationCancel={() => {}} />
);

DefaultStory.storyName = 'Default';
