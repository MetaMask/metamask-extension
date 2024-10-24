import { NamespaceId } from '@metamask/snaps-utils';
import { CaipChainId, KnownCaipNamespace } from '@metamask/utils';
import { useSelector } from 'react-redux';
import {
  getMemoizedAccountName,
  getAddressBookEntryByNetwork,
} from '../../selectors';
import { toChecksumHexAddress } from '../../../shared/modules/hexstring-utils';
import { decimalToHex } from '../../../shared/modules/conversion.utils';

export type UseDisplayNameParams = {
  chain: {
    namespace: NamespaceId;
    reference: string;
  };
  chainId: CaipChainId;
  address: string;
};

/**
 * Get the display name for an address.
 * This will look for an account name in the state, and if not found, it will look for an address book entry.
 *
 * @param params - The parsed CAIP-10 ID.
 * @returns The display name for the address.
 */
export const useDisplayName = (params: UseDisplayNameParams): string => {
  const {
    address,
    chain: { namespace, reference },
  } = params;

  const isEip155 = namespace === KnownCaipNamespace.Eip155;

  const parsedAddress = isEip155 ? toChecksumHexAddress(address) : address;

  const accountName = useSelector((state) =>
    // @ts-expect-error type issue
    getMemoizedAccountName(state, parsedAddress),
  );

  const addressBookEntry = useSelector((state) =>
    getAddressBookEntryByNetwork(
      state,
      // @ts-expect-error type issue
      parsedAddress,
      `0x${decimalToHex(isEip155 ? reference : `0`)}`,
    ),
  );

  return accountName || (isEip155 && addressBookEntry?.name) || undefined;
};
