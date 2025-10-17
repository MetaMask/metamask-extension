import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { isAddress as isEvmAddress } from 'ethers/lib/utils';
import { AddressBookEntry } from '@metamask/address-book-controller';

import { getCompleteAddressBook } from '../../../../selectors';
import { type Recipient } from './useRecipients';
import { useSendType } from './useSendType';
import { useAccountAddressSeedIconMap } from './useAccountAddressSeedIconMap';

export const useContactRecipients = (): Recipient[] => {
  const { isEvmSendType } = useSendType();
  const addressBook = useSelector(getCompleteAddressBook);
  const { accountAddressSeedIconMap } = useAccountAddressSeedIconMap();

  const processContacts = useCallback(
    (contact: AddressBookEntry) => {
      return {
        address: contact.address,
        contactName: contact.name,
        isContact: true,
        seedIcon: accountAddressSeedIconMap.get(contact.address.toLowerCase()),
      };
    },
    [accountAddressSeedIconMap],
  );

  // Contacts are only supported for EVM chains today - hence we only return contacts for EVM chains
  if (isEvmSendType) {
    return addressBook
      .filter((contact) => isEvmAddress(contact.address))
      .map(processContacts);
  }

  return [];
};
