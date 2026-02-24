import { useContext } from 'react';
import { useSelector } from 'react-redux';
import { toChecksumHexAddress } from '../../../../../../shared/modules/hexstring-utils';
import { shortenAddress } from '../../../../../helpers/utils/util';
import {
  getAddressBookEntry,
  getEnsResolutionByAddress,
  getMetadataContractName,
} from '../../../../../selectors';
import { getAccountGroupsByAddress } from '../../../../../selectors/multichain-accounts/account-tree';
import { MultichainAccountsState } from '../../../../../selectors/multichain-accounts/account-tree.types';
import { ConfirmInfoRowContext } from './row';

export const useRowContext = () => useContext(ConfirmInfoRowContext);

export const useFallbackDisplayName = function (address: string): {
  displayName: string;
  hexAddress: string;
} {
  const hexAddress = toChecksumHexAddress(address);
  const accountGroups = useSelector((state) =>
    getAccountGroupsByAddress(state as MultichainAccountsState, [hexAddress]),
  );
  const accountGroup = Array.isArray(accountGroups)
    ? accountGroups[0]
    : undefined;

  const accountName = accountGroup?.metadata?.name;
  const addressBookContact = useSelector((state) =>
    getAddressBookEntry(state, hexAddress),
  );
  const addressBookContactName = addressBookContact?.name;
  const metadataName = useSelector((state) =>
    getMetadataContractName(state, hexAddress),
  );
  const ensName = useSelector((state) =>
    getEnsResolutionByAddress(state, address),
  );
  const displayName =
    accountName ||
    addressBookContactName ||
    metadataName ||
    ensName ||
    shortenAddress(hexAddress);

  return { displayName, hexAddress };
};
