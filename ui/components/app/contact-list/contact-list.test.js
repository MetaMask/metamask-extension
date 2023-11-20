import React from 'react';
import { within } from '@testing-library/react';
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
      const { getAllByTestId } = renderWithProvider(
        <ContactList
          searchForContacts={() => {
            return [
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
          }}
          selectRecipient={selectRecipient}
          selectedAddress={selectedAddress}
        />,
        store,
      );

      const recipientGroups = getAllByTestId('recipient-group');
      expect(within(recipientGroups[0]).getByText('A')).toBeInTheDocument();
      const recipientsInA = within(recipientGroups[0]).getAllByTestId(
        'recipient',
      );
      expect(recipientsInA[0]).toHaveTextContent('aa0x0000...0001');
      expect(recipientsInA[1]).toHaveTextContent('Al0x0000...0000');
      expect(recipientsInA[2]).toHaveTextContent('Az0x0000...0002');
      expect(within(recipientGroups[1]).getByText('B')).toBeInTheDocument();
      const recipientsInB = within(recipientGroups[1]).getAllByTestId(
        'recipient',
      );
      expect(recipientsInB[0]).toHaveTextContent('bbb0x0000...0003');
    });
  });
});
