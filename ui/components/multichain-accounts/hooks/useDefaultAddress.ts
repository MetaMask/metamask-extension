import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { type AccountGroupId } from '@metamask/account-api';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { normalizeSafeAddress } from '../../../../shared/lib/multichain/address';
import { getDefaultScopeAndAddressByAccountGroupId } from '../../../selectors/multichain-accounts/account-tree';
import {
  getDefaultAddressScope,
  getShowDefaultAddressPreference,
} from '../../../selectors/selectors';
import { DefaultAddressScope } from '../../../../shared/constants/default-address';

type UseDefaultAddressReturn = {
  defaultAddress: string | null;
  defaultAddressScope: DefaultAddressScope;
  displayDefaultAddress: string | false | null;
  addressCopied: boolean;
  handleDefaultAddressClick: () => void;
};

export const useDefaultAddress = (
  groupId: AccountGroupId,
): UseDefaultAddressReturn => {
  const showDefaultAddressPreference = useSelector(
    getShowDefaultAddressPreference,
  );
  const defaultAddressScope = useSelector(
    getDefaultAddressScope,
  ) as DefaultAddressScope;
  // Select the string rather than the result object: the selector's bounded
  // LRU cache can return a new, equal object on every store update when many
  // account rows are rendered, which would re-render every row.
  const defaultAddress = useSelector(
    (state) =>
      getDefaultScopeAndAddressByAccountGroupId(state, groupId).defaultAddress,
  );

  const displayDefaultAddress = showDefaultAddressPreference && defaultAddress;

  const [addressCopied, handleCopy] = useCopyToClipboard();

  const handleDefaultAddressClick = useCallback(() => {
    if (defaultAddress) {
      handleCopy(normalizeSafeAddress(defaultAddress));
    }
  }, [defaultAddress, handleCopy]);

  return {
    defaultAddress,
    defaultAddressScope,
    displayDefaultAddress,
    addressCopied,
    handleDefaultAddressClick,
  };
};
