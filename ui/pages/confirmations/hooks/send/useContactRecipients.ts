import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { isAddress as isEvmAddress } from 'ethers/lib/utils';
import { isSolanaChainId } from '@metamask/bridge-controller';
import { AddressBookEntry } from '@metamask/address-book-controller';

import { getCompleteAddressBook } from '../../../../selectors';
import { type Recipient } from './useRecipients';
import { useSendType } from './useSendType';

export const useContactRecipients = (): Recipient[] => {
  const { isEvmSendType, isSolanaSendType } = useSendType();
  const addressBook = useSelector(getCompleteAddressBook);

  const processContacts = useCallback((contact: AddressBookEntry) => {
    return {
      address: contact.address,
      contactName: contact.name,
    };
  }, []);

  if (isEvmSendType) {
    return addressBook
      .filter((contact) => isEvmAddress(contact.address))
      .map(processContacts);
  }
  if (isSolanaSendType) {
    return addressBook
      .filter((contact) => isSolanaChainId(contact.chainId))
      .map(processContacts);
  }

  return [];
};
