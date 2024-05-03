import { Meta } from '@storybook/react';
import React from 'react';
import { Provider } from 'react-redux';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../test/data/confirmations/contract-interaction';
import mockState from '../../../../../../../test/data/mock-state.json';
import configureStore from '../../../../../../store/store';
import { TransactionDetails } from './transaction-details';

const store = configureStore({
  metamask: { ...mockState.metamask },
  confirm: {
    currentConfirmation: genUnapprovedContractInteractionConfirmation(),
  },
});

const Story = {
  title: 'Components/App/Confirm/info/TransactionDetails',
  component: TransactionDetails,
  decorators: [
    (story: () => Meta<typeof TransactionDetails>) => (
      <Provider store={store}>{story()}</Provider>
    ),
  ],
};

export default Story;

export const DefaultStory = () => <TransactionDetails />;

DefaultStory.storyName = 'Default';
