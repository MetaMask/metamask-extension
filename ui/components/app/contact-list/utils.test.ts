import { AddressBookEntry } from '@metamask/address-book-controller';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { EthScope } from '@metamask/keyring-api';
import {
  buildDuplicateContactMap,
  hasDuplicateContacts,
  isDuplicateContact,
} from './utils';

describe('Contact List Utils', () => {
  const mockAddressBook: AddressBookEntry[] = [
    { name: 'Contact 1', address: '0x123', chainId: '0x1', memo: '' },
    { name: 'Contact 2', address: '0x456', chainId: '0x1', memo: '' },
  ];

  const mockInternalAccounts: InternalAccount[] = [
    {
      id: 'account-1',
      address: '0xabc',
      metadata: { name: 'Account 1', keyring: { type: 'HD Key Tree' } },
      type: EthScope.Eoa,
      options: {},
      methods: [],
      scopes: [],
    } as InternalAccount,
    {
      id: 'account-2',
      address: '0xdef',
      metadata: { name: 'Account 2', keyring: { type: 'HD Key Tree' } },
      type: EthScope.Eoa,
      options: {},
      methods: [],
      scopes: [],
    } as InternalAccount,
  ];

  describe('buildDuplicateContactMap', () => {
    it('builds a map of contact names to addresses', () => {
      const result = buildDuplicateContactMap(
        mockAddressBook,
        mockInternalAccounts,
      );

      expect(result.get('account 1')).toEqual(['account-id-account-1']);
      expect(result.get('account 2')).toEqual(['account-id-account-2']);
    });

    it('handles accounts with undefined metadata gracefully', () => {
      const accountsWithUndefinedMetadata: InternalAccount[] = [
        ...mockInternalAccounts,
        {
          id: 'account-3',
          address: '0x999',
          metadata: undefined,
          type: EthScope.Eoa,
          options: {},
          methods: [],
          scopes: [],
        } as unknown as InternalAccount,
        {
          id: 'account-4',
          address: '0x888',
          metadata: { name: undefined, keyring: { type: 'HD Key Tree' } },
          type: EthScope.Eoa,
          options: {},
          methods: [],
          scopes: [],
        } as unknown as InternalAccount,
      ];

      const result = buildDuplicateContactMap(
        mockAddressBook,
        accountsWithUndefinedMetadata,
      );

      // Should only include accounts with valid metadata.name
      expect(result.get('account 1')).toEqual(['account-id-account-1']);
      expect(result.get('account 2')).toEqual(['account-id-account-2']);
      expect(result.get('undefined')).toBeUndefined();
    });
  });

  describe('hasDuplicateContacts', () => {
    it('returns false when there are no duplicate contacts', () => {
      const result = hasDuplicateContacts(
        mockAddressBook,
        mockInternalAccounts,
      );
      expect(result).toBe(false);
    });

    it('returns true when there are duplicate contacts in address book', () => {
      const duplicateAddressBook: AddressBookEntry[] = [
        ...mockAddressBook,
        { name: 'Contact 1', address: '0x789', chainId: '0x1', memo: '' },
      ];

      const result = hasDuplicateContacts(
        duplicateAddressBook,
        mockInternalAccounts,
      );
      expect(result).toBe(true);
    });

    it('returns true when account name collides with contact name', () => {
      const accountsWithCollision: InternalAccount[] = [
        {
          id: 'account-1',
          address: '0xabc',
          metadata: { name: 'Contact 1', keyring: { type: 'HD Key Tree' } },
          type: EthScope.Eoa,
          options: {},
          methods: [],
          scopes: [],
        } as InternalAccount,
      ];

      const result = hasDuplicateContacts(
        mockAddressBook,
        accountsWithCollision,
      );
      expect(result).toBe(true);
    });

    it('handles accounts with undefined metadata gracefully', () => {
      const accountsWithUndefinedMetadata: InternalAccount[] = [
        ...mockInternalAccounts,
        {
          id: 'account-3',
          address: '0x999',
          metadata: undefined,
          type: EthScope.Eoa,
          options: {},
          methods: [],
          scopes: [],
        } as unknown as InternalAccount,
      ];

      const result = hasDuplicateContacts(
        mockAddressBook,
        accountsWithUndefinedMetadata,
      );
      expect(result).toBe(false);
    });
  });

  describe('isDuplicateContact', () => {
    it('returns true when name exists in address book', () => {
      const result = isDuplicateContact(
        mockAddressBook,
        mockInternalAccounts,
        'Contact 1',
      );
      expect(result).toBe(true);
    });

    it('returns true when name exists in internal accounts', () => {
      const result = isDuplicateContact(
        mockAddressBook,
        mockInternalAccounts,
        'Account 1',
      );
      expect(result).toBe(true);
    });

    it('returns false when name does not exist', () => {
      const result = isDuplicateContact(
        mockAddressBook,
        mockInternalAccounts,
        'New Contact',
      );
      expect(result).toBe(false);
    });

    it('is case insensitive', () => {
      const result = isDuplicateContact(
        mockAddressBook,
        mockInternalAccounts,
        'contact 1',
      );
      expect(result).toBe(true);
    });

    it('handles accounts with undefined metadata gracefully', () => {
      const accountsWithUndefinedMetadata: InternalAccount[] = [
        ...mockInternalAccounts,
        {
          id: 'account-3',
          address: '0x999',
          metadata: undefined,
          type: EthScope.Eoa,
          options: {},
          methods: [],
          scopes: [],
        } as unknown as InternalAccount,
        {
          id: 'account-4',
          address: '0x888',
          metadata: { name: undefined, keyring: { type: 'HD Key Tree' } },
          type: EthScope.Eoa,
          options: {},
          methods: [],
          scopes: [],
        } as unknown as InternalAccount,
      ];

      const result = isDuplicateContact(
        mockAddressBook,
        accountsWithUndefinedMetadata,
        'New Contact',
      );
      expect(result).toBe(false);
    });

    it('handles address book entries with undefined names gracefully', () => {
      const addressBookWithUndefinedNames: AddressBookEntry[] = [
        ...mockAddressBook,
        {
          name: undefined as unknown as string,
          address: '0x999',
          chainId: '0x1',
          memo: '',
        },
      ];

      const result = isDuplicateContact(
        addressBookWithUndefinedNames,
        mockInternalAccounts,
        'New Contact',
      );
      expect(result).toBe(false);
    });
  });
});
