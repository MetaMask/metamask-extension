import { Meta } from '@storybook/react';
import React from 'react';
import { Provider } from 'react-redux';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../test/data/confirmations/contract-interaction';
import mockState from '../../../../../../../test/data/mock-state.json';
import configureStore from '../../../../../../store/store';
import BaseTransactionInfo from './base-transaction-info';

const store = configureStore({
  ...mockState,
  metamask: {
    ...mockState.metamask,
  },
  confirm: {
    currentConfirmation: genUnapprovedContractInteractionConfirmation(),
  },
});

const Story = {
  title: 'Components/App/Confirm/info/BaseTransactionInfo',
  component: BaseTransactionInfo,
  decorators: [
    (story: () => Meta<typeof BaseTransactionInfo>) => (
      <Provider store={store}>{story()}</Provider>
    ),
  ],
};

export default Story;

export const DefaultStory = () => <BaseTransactionInfo />;

DefaultStory.storyName = 'Default';
