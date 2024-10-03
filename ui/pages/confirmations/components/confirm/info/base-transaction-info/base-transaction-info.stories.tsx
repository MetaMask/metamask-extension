import { Meta } from '@storybook/react';
import React from 'react';
import { Provider } from 'react-redux';
import { getMockContractInteractionConfirmState } from '../../../../../../../test/data/confirmations/helper';
import configureStore from '../../../../../../store/store';
import { ConfirmContextProvider } from '../../../../context/confirm';
import BaseTransactionInfo from './base-transaction-info';

const store = configureStore(getMockContractInteractionConfirmState());

const Story = {
  title: 'Components/App/Confirm/info/BaseTransactionInfo',
  component: BaseTransactionInfo,
  decorators: [
    (story: () => Meta<typeof BaseTransactionInfo>) => (
      <Provider store={store}>
        <ConfirmContextProvider>{story()}</ConfirmContextProvider>
      </Provider>
    ),
  ],
};

export default Story;

export const DefaultStory = () => <BaseTransactionInfo />;

DefaultStory.storyName = 'Default';
