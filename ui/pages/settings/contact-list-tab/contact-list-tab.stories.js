import React from 'react';
import { Provider } from 'react-redux';
import { object, boolean, select } from '@storybook/addon-knobs';

import configureStore from '../../../store/store';
import testData from '../../../../.storybook/test-data';
import ContactListTab from './contact-list-tab.component';

// Using Test Data For Redux
const store = configureStore(testData);

export default {
  title: 'Pages/Settings/ContactListTab',
  id: __filename,
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
};

export const DefaultStory = () => {
  const { metamask } = store.getState();
  const { addresses } = metamask;
  const addressBook = object('Address Book', addresses);
  const hideAddressBook = boolean('Hide Address Book', false);
  const selectedAddress = select(
    'Selected Address',
    addresses.map(({ address }) => address),
  );

  return (
    <div style={{ width: 300 }}>
      <ContactListTab
        addressBook={addressBook}
        history={{ push: () => undefined }}
        hideAddressBook={hideAddressBook}
        selectedAddress={selectedAddress}
      />
    </div>
  );
};

DefaultStory.storyName = 'Default';
