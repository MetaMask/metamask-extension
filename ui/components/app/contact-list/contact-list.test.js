import React from 'react';
import { shallowWithContext } from '../../../../test/lib/render-helpers';
import RecipientGroup from './recipient-group';
import ContactList from '.';

describe('Contact List', () => {
  describe('given searchForContacts', () => {
    it('sorts contacts by name within each letter group', () => {
      const contacts = {
        Al: { name: 'Al', address: '0x0' },
        aa: { name: 'aa', address: '0x1' },
        Az: { name: 'Az', address: '0x2' },
        Bl: { name: 'Bl', address: '0x3' },
        ba: { name: 'ba', address: '0x4' },
        Bz: { name: 'Bz', address: '0x5' },
        Ccc: { name: 'Ccc', address: '0x6' },
      };
      const searchForContacts = () => {
        return Object.values(contacts);
      };
      const selectRecipient = () => null;
      const selectedAddress = null;

      const wrapper = shallowWithContext(
        <ContactList
          searchForContacts={searchForContacts}
          selectRecipient={selectRecipient}
          selectedAddress={selectedAddress}
        />,
      );

      expect(wrapper).toMatchElement(
        <div className="send__select-recipient-wrapper__list">
          <RecipientGroup
            key="A-contact-group"
            label="A"
            items={[contacts.aa, contacts.Al, contacts.Az]}
            onSelect={selectRecipient}
            selectedAddress={selectedAddress}
          />
          <RecipientGroup
            key="B-contact-group"
            label="B"
            items={[contacts.ba, contacts.Bl, contacts.Bz]}
            onSelect={selectRecipient}
            selectedAddress={selectedAddress}
          />
          <RecipientGroup
            key="C-contact-group"
            label="C"
            items={[contacts.Ccc]}
            onSelect={selectRecipient}
            selectedAddress={selectedAddress}
          />
        </div>,
        { ignoreProps: false },
      );
    });
  });
});
