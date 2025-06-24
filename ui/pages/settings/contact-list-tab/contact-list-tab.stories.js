import React from 'react';
import { Provider } from 'react-redux';

import configureStore from '../../../store/store';
import testData from '../../../../.storybook/test-data';
import { getInternalAccounts } from '../../../selectors';
import ContactListTab from './contact-list-tab.component';

// Using Test Data For Redux
const store = configureStore(testData);

export default {
  title: 'Pages/Settings/ContactListTab',

  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
  argsTypes: {
    internalAccounts: { control: 'object' },
    hideAddressBook: { control: 'boolean' },
    selectedAddress: { control: 'select' },
    history: { action: 'history' },
  },
};

const { metamask } = store.getState();
const { addresses } = metamask;

const internalAccounts = getInternalAccounts(store.getState());

export const DefaultStory = (args) => {
  return (
    <div style={{ width: 300 }}>
      <ContactListTab {...args} />
    </div>
  );
};

DefaultStory.storyName = 'Default';
DefaultStory.args = {
  completeAddressBook: addresses,
  addressBook: addresses,
  internalAccounts,
  hideAddressBook: false,
  selectedAddress: addresses.map(({ address }) => address),
};
