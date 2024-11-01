import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/jest/rendering';
import { MOCK_ADDRESS_BOOK } from '../../../../test/data/mock-data';
import ContactList from '.';

describe('Contact List', () => {
  const store = configureMockStore([])({
    metamask: {},
  });

  const mockAddressBook = [...MOCK_ADDRESS_BOOK, MOCK_ADDRESS_BOOK[0]]; // Adding duplicate contact

  it('displays the warning banner when multiple contacts have the same name', () => {
    const { getByText } = renderWithProvider(
      <ContactList addressBook={mockAddressBook} />,
      store,
    );

    const duplicateContactBanner = getByText('You have duplicate contacts');

    expect(duplicateContactBanner).toBeVisible();
  });

  describe('given searchForContacts', () => {
    const selectRecipient = () => null;
    const selectedAddress = null;

    it('sorts contacts by name within each letter group', () => {
      const contacts = [
        {
          name: 'Al',
          address: '0x0000000000000000000000000000000000000000',
        },
        {
          name: 'aa',
          address: '0x0000000000000000000000000000000000000001',
        },
        {
          name: 'Az',
          address: '0x0000000000000000000000000000000000000002',
        },
        {
          name: 'bbb',
          address: '0x0000000000000000000000000000000000000003',
        },
      ];

      const { getAllByTestId } = renderWithProvider(
        <ContactList
          searchForContacts={() => contacts}
          selectRecipient={selectRecipient}
          selectedAddress={selectedAddress}
        />,
        store,
      );

      const recipientLabels = getAllByTestId('address-list-item-label');
      const recipientAddresses = getAllByTestId('address-list-item-address');

      expect(recipientAddresses[0]).toHaveTextContent('0x00000...00001');
      expect(recipientLabels[0]).toHaveTextContent(contacts[1].name);

      expect(recipientAddresses[1]).toHaveTextContent('0x00000...00000');
      expect(recipientLabels[1]).toHaveTextContent(contacts[0].name);

      expect(recipientAddresses[2]).toHaveTextContent('0x00000...00002');
      expect(recipientLabels[2]).toHaveTextContent(contacts[2].name);

      expect(recipientAddresses[3]).toHaveTextContent('0x00000...00003');
      expect(recipientLabels[3]).toHaveTextContent(contacts[3].name);
    });
  });
});
