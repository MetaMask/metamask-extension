import { useContext } from 'react';
import { useSelector } from 'react-redux';
import { toChecksumHexAddress } from '../../../../../../shared/modules/hexstring-utils';
import { shortenAddress } from '../../../../../helpers/utils/util';
import {
  getAccountName,
  getAddressBookEntry,
  getEnsResolutionByAddress,
  getInternalAccounts,
  getIsMultichainAccountsState2Enabled,
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
  const isMultichainAccountsState2Enabled = useSelector(
    getIsMultichainAccountsState2Enabled,
  );
  const accountGroups = useSelector((state) =>
    getAccountGroupsByAddress(state as MultichainAccountsState, [hexAddress]),
  );
  const accountGroup = Array.isArray(accountGroups)
    ? accountGroups[0]
    : undefined;

  const internalAccounts = useSelector(getInternalAccounts);
  const accountName = isMultichainAccountsState2Enabled
    ? accountGroup?.metadata?.name
    : getAccountName(internalAccounts, hexAddress);
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
