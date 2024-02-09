import React from 'react';
import { Provider } from 'react-redux';

import { TransactionType } from '@metamask/transaction-controller';

import mockState from '../../../../../../test/data/mock-state.json';
import configureStore from '../../../../../store/store';
import SenderInfo from './sender-info';

const store = configureStore({
  metamask: {
    ...mockState.metamask,
  },
  confirm: {
    currentConfirmation: {
      type: TransactionType.personalSign,
      msgParams: {
        origin: 'https://metamask.github.io',
      },
    },
  },
});

const Story = {
  title: 'Components/App/Confirm/SenderInfo',
  component: SenderInfo,
  decorators: [
    (story: () => any) => <Provider store={store}>{story()}</Provider>,
  ],
};

export default Story;

export const DefaultStory = () => <SenderInfo />;

DefaultStory.storyName = 'Default';
