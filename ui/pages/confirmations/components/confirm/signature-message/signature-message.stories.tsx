import React from 'react';
import { Provider } from 'react-redux';

import { TransactionType } from '@metamask/transaction-controller';

import mockState from '../../../../../../test/data/mock-state.json';
import configureStore from '../../../../../store/store';
import SignatureMessage from './signature-message';

const store = configureStore({
  metamask: {
    ...mockState.metamask,
  },
  confirm: {
    currentConfirmation: {
      type: TransactionType.personalSign,
      msgParams: {
        data: '0x4578616d706c652060706572736f6e616c5f7369676e60206d657373616765',
      },
    },
  },
});

const Story = {
  title: 'Components/App/Confirm/SignatureMessage',
  component: SignatureMessage,
  decorators: [
    (story: () => any) => <Provider store={store}>{story()}</Provider>,
  ],
};

export default Story;

export const DefaultStory = () => <SignatureMessage />;

DefaultStory.storyName = 'Default';
