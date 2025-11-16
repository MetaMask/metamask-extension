import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { getCompleteAddressBook } from '../../../../selectors';
import { useSendContext } from '../../context/send';
import { type Recipient } from './useRecipients';
import { useSendType } from './useSendType';
import { useAccountAddressSeedIconMap } from './useAccountAddressSeedIconMap';

export const useContactRecipients = (): Recipient[] => {
  const { isEvmSendType } = useSendType();
  const addressBook = useSelector(getCompleteAddressBook);
  const { accountAddressSeedIconMap } = useAccountAddressSeedIconMap();
  const { chainId } = useSendContext();

  const contacts = useMemo(() => {
    if (!isEvmSendType) {
      return [];
    }

    return (
      addressBook
        ?.filter((contact) => contact.chainId === chainId)
        ?.map((contact) => ({
          address: contact.address,
          contactName: contact.name,
          isContact: true,
          seedIcon: accountAddressSeedIconMap.get(
            contact.address.toLowerCase(),
          ),
        })) ?? []
    );
  }, [addressBook, chainId, isEvmSendType]);

  return contacts;
};
