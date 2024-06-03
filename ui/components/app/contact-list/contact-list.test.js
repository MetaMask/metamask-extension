import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/jest/rendering';
import ContactList from '.';

describe('Contact List', () => {
  const store = configureMockStore([])({
    metamask: { providerConfig: { chainId: '0x0' } },
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
