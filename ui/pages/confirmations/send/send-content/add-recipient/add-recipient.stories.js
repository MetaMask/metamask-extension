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

  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
  argTypes: {
    userInput: {
      control: 'text',
    },
    ownedAccounts: {
      control: 'array',
    },
    addressBook: {
      control: 'array',
    },
    updateRecipient: {
      action: 'updateRecipient',
    },
    domainResolution: {
      control: 'text',
    },
    domainError: {
      control: 'text',
    },
    domainWarning: {
      control: 'text',
    },
    addressBookEntryName: {
      control: 'text',
    },
    contacts: {
      control: 'array',
    },
    nonContacts: {
      control: 'array',
    },
    useMyAccountsForRecipientSearch: {
      action: 'useMyAccountsForRecipientSearch',
    },
    useContactListForRecipientSearch: {
      action: 'useContactListForRecipientSearch',
    },
    recipient: {
      control: 'object',
    },
  },
  args: {
    recipient,
    contacts: [addressBook],
    nonContacts: [addressBook],
    ownedAccounts: [addressBook],
    addressBook: [addressBook],
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
ErrorStory.storyName = 'Error';
ErrorStory.args = {
  // domainError must be the key for a translation
  domainError: 'loading',
};

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
WarningStory.storyName = 'Warning';
WarningStory.args = {
  // domainWarning must be the key for a translation
  domainWarning: 'loading',
};
