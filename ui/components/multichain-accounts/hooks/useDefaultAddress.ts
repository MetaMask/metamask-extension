import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { type AccountGroupId } from '@metamask/account-api';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
// eslint-disable-next-line import-x/no-restricted-paths
import { normalizeSafeAddress } from '../../../../app/scripts/lib/multichain/address';
import { getDefaultScopeAndAddressByAccountGroupId } from '../../../selectors/multichain-accounts/account-tree';
import {
  getDefaultAddressScope,
  getIsDefaultAddressEnabled,
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
  const isDefaultAddressEnabled = useSelector(getIsDefaultAddressEnabled);
  const showDefaultAddressPreference = useSelector(
    getShowDefaultAddressPreference,
  );
  const defaultAddressScope = useSelector(
    getDefaultAddressScope,
  ) as DefaultAddressScope;
  const { defaultAddress } = useSelector((state) =>
    getDefaultScopeAndAddressByAccountGroupId(state, groupId),
  );

  const displayDefaultAddress =
    isDefaultAddressEnabled && showDefaultAddressPreference && defaultAddress;

  const [addressCopied, handleCopy] = useCopyToClipboard({
    clearDelayMs: null,
  });

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
