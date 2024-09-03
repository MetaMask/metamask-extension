import { Meta } from '@storybook/react';
import React from 'react';
import { Provider } from 'react-redux';
import {
  PAYMASTER_AND_DATA,
  genUnapprovedContractInteractionConfirmation,
} from '../../../../../../../../test/data/confirmations/contract-interaction';
import mockState from '../../../../../../../../test/data/mock-state.json';
import configureStore from '../../../../../../../store/store';
import { TransactionDetails } from './transaction-details';

function getStore() {
  const confirmation = {
    ...genUnapprovedContractInteractionConfirmation(),
    isUserOperation: true,
  };

  return configureStore({
    metamask: {
      ...mockState.metamask,
      preferences: {
        ...mockState.metamask.preferences,
        petnamesEnabled: true,
      },
      userOperations: {
        [confirmation.id]: {
          userOperation: {
            paymasterAndData: PAYMASTER_AND_DATA,
          },
        },
      },
    },
    confirm: {
      currentConfirmation: confirmation,
    },
  });
}

const Story = {
  title: 'Components/App/Confirm/info/TransactionDetails',
  component: TransactionDetails,
  decorators: [
    (story: () => Meta<typeof TransactionDetails>) => (
      <Provider store={getStore()}>
        <div
          style={{
            backgroundColor: 'var(--color-background-alternative)',
            padding: 30,
          }}
        >
          {story()}
        </div>
      </Provider>
    ),
  ],
};

export default Story;

export const DefaultStory = () => <TransactionDetails />;

DefaultStory.storyName = 'Default';
