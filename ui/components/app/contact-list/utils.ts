import { AddressBookEntry } from '@metamask/address-book-controller';
import { InternalAccount } from '@metamask/keyring-api';

export const hasDuplicateContacts = (
  addressBook: AddressBookEntry[],
  internalAccounts: InternalAccount[],
) => {
  const uniqueContactNames = Array.from(
    new Set(addressBook.map(({ name }) => name.toLowerCase().trim())),
  );

  const hasAccountNameCollision = internalAccounts.some((account) =>
    uniqueContactNames.includes(account.metadata.name.toLowerCase().trim()),
  );

  return (
    uniqueContactNames.length !== addressBook.length || hasAccountNameCollision
  );
};

export const isDuplicateContact = (
  addressBook: AddressBookEntry[],
  internalAccounts: InternalAccount[],
  newName: string,
) => {
  const nameExistsInAddressBook = addressBook.some(
    ({ name }) => name.toLowerCase().trim() === newName.toLowerCase().trim(),
  );

  const nameExistsInAccountList = internalAccounts.some(
    ({ metadata }) =>
      metadata.name.toLowerCase().trim() === newName.toLowerCase().trim(),
  );

  return !nameExistsInAddressBook && !nameExistsInAccountList;
};
