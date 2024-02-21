import React from 'react';
import { Provider } from 'react-redux';

import { TransactionType } from '@metamask/transaction-controller';

import mockState from '../../../../../../test/data/mock-state.json';
import configureStore from '../../../../../store/store';
import Info from './info';

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
  title: 'Confirmations/Components/Confirm/Info',
  component: Info,
  decorators: [
    (story: () => any) => <Provider store={store}>{story()}</Provider>,
  ],
};

export default Story;

export const DefaultStory = () => <Info />;

DefaultStory.storyName = 'Default';
