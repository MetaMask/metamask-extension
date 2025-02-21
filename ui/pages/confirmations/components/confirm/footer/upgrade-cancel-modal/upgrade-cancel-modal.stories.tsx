import React from 'react';
import { Provider } from 'react-redux';
import configureStore from '../../../../../../store/store';
import { ConfirmContextProvider } from '../../../../context/confirm';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../test/data/confirmations/contract-interaction';
import { getMockConfirmStateForTransaction } from '../../../../../../../test/data/confirmations/helper';
import { UpgradeCancelModal } from './upgrade-cancel-modal';

const DELEGATION_MOCK = '0x1234567890abcdef1234567890abcdef12345678';

const TRANSACTION_MOCK = genUnapprovedContractInteractionConfirmation({
  authorizationList: [{ address: DELEGATION_MOCK }],
});

const STATE_MOCK = getMockConfirmStateForTransaction(TRANSACTION_MOCK);

const store = configureStore(STATE_MOCK);

const Story = {
  title: 'Confirmations/Components/Confirm/UpgradeCancelModal',
  component: UpgradeCancelModal,
  decorators: [
    (story) => {
      return (
        <Provider store={store}>
          <ConfirmContextProvider>{story()}</ConfirmContextProvider>
        </Provider>
      );
    },
  ],
};

export default Story;

export const DefaultStory = () => (
  <UpgradeCancelModal isOpen={true} onClose={() => {}} onReject={() => {}} />
);

DefaultStory.storyName = 'Default';
