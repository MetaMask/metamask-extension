import {
  CaipChainId,
  KnownCaipNamespace,
  CaipNamespace,
} from '@metamask/utils';
import { useSelector } from 'react-redux';
import {
  getMemoizedAccountName,
  getAddressBookEntryByNetwork,
  AddressBookMetaMaskState,
  AccountsMetaMaskState,
} from '../../selectors/snaps';
import { toChecksumHexAddress } from '../../../shared/modules/hexstring-utils';
import { decimalToHex } from '../../../shared/modules/conversion.utils';

export type UseDisplayNameParams = {
  chain: {
    namespace: CaipNamespace;
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
export const useDisplayName = (
  params: UseDisplayNameParams,
): string | undefined => {
  const {
    address,
    chain: { namespace, reference },
  } = params;

  const isEip155 = namespace === KnownCaipNamespace.Eip155;

  const parsedAddress = isEip155 ? toChecksumHexAddress(address) : address;

  const accountName = useSelector((state: AccountsMetaMaskState) =>
    getMemoizedAccountName(state, parsedAddress),
  );

  const addressBookEntry = useSelector((state: AddressBookMetaMaskState) =>
    getAddressBookEntryByNetwork(
      state,
      parsedAddress,
      `0x${decimalToHex(isEip155 ? reference : `0`)}`,
    ),
  );

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  return accountName || (isEip155 && addressBookEntry?.name) || undefined;
};
