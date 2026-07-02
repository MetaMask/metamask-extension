import { Meta } from '@storybook/react';
import React from 'react';
import { Provider } from 'react-redux';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../../test/data/confirmations/contract-interaction';
import { getMockConfirmStateForTransaction } from '../../../../../../../../test/data/confirmations/helper';
import configureStore from '../../../../../../../store/store';
import { ConfirmContextProvider } from '../../../../../context/confirm';
import { TransactionDetails } from './transaction-details';

function getStore() {
  const confirmation = genUnapprovedContractInteractionConfirmation();

  return configureStore(
    getMockConfirmStateForTransaction(confirmation, {
      metamask: {
        preferences: {},
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
