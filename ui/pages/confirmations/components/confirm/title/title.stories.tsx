import React from 'react';
import { Provider } from 'react-redux';
import { TransactionType } from '@metamask/transaction-controller';

import { getMockPersonalSignConfirmState } from '../../../../../../test/data/confirmations/helper';
import configureStore from '../../../../../store/store';
import { ConfirmContextProvider } from '../../../context/confirm';

import ConfirmTitle from './title';

const store = configureStore(getMockPersonalSignConfirmState());

const Story = {
  title: 'Components/App/Confirm/Title',
  component: ConfirmTitle,
  decorators: [
    (story: () => any) => (
      <Provider store={store}>
        <ConfirmContextProvider>{story()}</ConfirmContextProvider>
      </Provider>
    ),
  ],
};

export default Story;

export const DefaultStory = () => <ConfirmTitle />;

DefaultStory.storyName = 'Default';
