import { Meta } from '@storybook/react';
import React from 'react';
import { Provider } from 'react-redux';
import {
  PAYMASTER_AND_DATA,
  genUnapprovedContractInteractionConfirmation,
} from '../../../../../../../../test/data/confirmations/contract-interaction';
import mockState from '../../../../../../../../test/data/mock-state.json';
import { getMockConfirmStateForTransaction } from '../../../../../../../../test/data/confirmations/helper';
import configureStore from '../../../../../../../store/store';
import { ConfirmContextProvider } from '../../../../../context/confirm';
import { TransactionDetails } from './transaction-details';

function getStore() {
  const confirmation = {
    ...genUnapprovedContractInteractionConfirmation(),
    isUserOperation: true,
  };

  return configureStore(
    getMockConfirmStateForTransaction(confirmation, {
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
    }),
  );
}

const Story = {
  title: 'Components/App/Confirm/info/TransactionDetails',
  component: TransactionDetails,
  decorators: [
    (story: () => Meta<typeof TransactionDetails>) => (
      <Provider store={getStore()}>
        <ConfirmContextProvider>
          <div
            style={{
              backgroundColor: 'var(--color-background-alternative)',
              padding: 30,
            }}
          >
            {story()}
          </div>
        </ConfirmContextProvider>
      </Provider>
    ),
  ],
};

export default Story;

export const DefaultStory = () => <TransactionDetails />;

DefaultStory.storyName = 'Default';
