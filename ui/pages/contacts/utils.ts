import { AddressBookEntry } from '@metamask/address-book-controller';
import { InternalAccount } from '@metamask/keyring-internal-api';

const getAccountName = (account: InternalAccount): string =>
  account?.metadata?.name ?? '';

export const buildDuplicateContactMap = (
  addressBook: AddressBookEntry[],
  internalAccounts: InternalAccount[],
) => {
  const contactMap = new Map<string, string[]>(
    internalAccounts
      .filter((account) => getAccountName(account))
      .map((account) => [
        getAccountName(account).trim().toLowerCase(),
        [`account-id-${account.id}`],
      ]),
  );

  addressBook.forEach((entry) => {
    const { name, address } = entry;

    const sanitizedName = name.trim().toLowerCase();

    const currentArray = contactMap.get(sanitizedName) ?? [];
    currentArray.push(address);

    contactMap.set(sanitizedName, currentArray);
  });

  return contactMap;
};

export const hasDuplicateContacts = (
  addressBook: AddressBookEntry[],
  internalAccounts: InternalAccount[],
) => {
  const uniqueContactNames = Array.from(
    new Set(addressBook.map(({ name }) => name.toLowerCase().trim())),
  );

  const hasAccountNameCollision = internalAccounts.some((account) => {
    const name = getAccountName(account);
    return name && uniqueContactNames.includes(name.toLowerCase().trim());
  });

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

  const nameExistsInAccountList = internalAccounts.some((account) => {
    const name = getAccountName(account);
    return name && name.toLowerCase().trim() === newName.toLowerCase().trim();
  });

  return nameExistsInAddressBook || nameExistsInAccountList;
};
