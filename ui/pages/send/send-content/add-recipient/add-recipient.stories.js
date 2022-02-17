import React from 'react';
import { Provider } from 'react-redux';

import configureStore from '../../../../store/store';

import testData from '../../../../../.storybook/test-data';
import AddRecipient from './add-recipient.component';

const store = configureStore(testData);

const { metamask } = store.getState();
const { addressBook } = metamask;
const recipient = metamask.accountArray[0];

export default {
  title: 'Pages/Send/SendContent/AddRecipient',
  id: __filename,
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
  argTypes: {
    recipient: { type: 'text', defaultValue: recipient },
    contacts: { type: 'object', defaultValue: [addressBook] },
    nonContacts: { type: 'object', defaultValue: [addressBook] },
    ownedAccounts: { type: 'object', defaultValue: [addressBook] },
    addressBook: { type: 'object', defaultValue: [addressBook] },
  },
};

export const DefaultStory = (args) => {
  return (
    <div style={{ width: 300 }}>
      <AddRecipient
        {...args}
        updateRecipient={() => undefined}
        updateGas={() => undefined}
      />
    </div>
  );
};

DefaultStory.storyName = 'Default';

export const ErrorStory = (args) => {
  return (
    <div style={{ width: 300 }}>
      <AddRecipient
        {...args}
        updateRecipient={() => undefined}
        updateGas={() => undefined}
      />
    </div>
  );
};

ErrorStory.argTypes = {
  // ensError must be the key for a translation
  ensError: { type: 'text', defaultValue: 'loading' },
};

ErrorStory.storyName = 'Error';

export const WarningStory = (args) => {
  return (
    <div style={{ width: 300 }}>
      <AddRecipient
        {...args}
        updateRecipient={() => undefined}
        updateGas={() => undefined}
      />
    </div>
  );
};

WarningStory.argTypes = {
  // ensWarning must be the key for a translation
  ensWarning: { type: 'text', defaultValue: 'loading' },
};

WarningStory.storyName = 'Warning';
