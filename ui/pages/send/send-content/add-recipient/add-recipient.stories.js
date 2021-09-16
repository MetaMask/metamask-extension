import React from 'react';
import { Provider } from 'react-redux';
import { text } from '@storybook/addon-knobs';

import configureStore from '../../../../store/store';

import testData from '../../../../../.storybook/test-data';
import AddRecipient from './add-recipient.component';

const store = configureStore(testData);

export default {
  title: 'AddRecipient',
  id: __filename,
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
};

export const AddRecipientComponent = () => {
  const { metamask } = store.getState();
  const { addressBook, recipient } = metamask;
  return (
    <div style={{ width: 300 }}>
      <AddRecipient
        contacts={[addressBook]}
        recipient={recipient}
        updateRecipient={() => undefined}
        nonContacts={[addressBook]}
        ownedAccounts={[addressBook]}
        addressBook={[addressBook]}
        updateGas={() => undefined}
        // ToError and ToWarning wording must match on translation
        ensError={text('To Error', 'loading')}
        ensWarning={text('To Warning', 'loading')}
      />
    </div>
  );
};
