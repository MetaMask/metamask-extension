import React from 'react';
import { Provider } from 'react-redux';
import { TransactionType } from '@metamask/transaction-controller';

import mockState from '../../../../../../test/data/mock-state.json';
import configureStore from '../../../../../store/store';

import ConfirmTitle from './title';

const store = configureStore({
  metamask: {
    ...mockState.metamask,
  },
  confirm: {
    currentConfirmation: {
      type: [TransactionType.personalSign],
    },
  },
});

const Story = {
  title: 'Components/App/Confirm/Title',
  component: ConfirmTitle,
  decorators: [
    (story: () => any) => <Provider store={store}>{story()}</Provider>,
  ],
};

export default Story;

export const DefaultStory = () => <ConfirmTitle />;

DefaultStory.storyName = 'Default';
