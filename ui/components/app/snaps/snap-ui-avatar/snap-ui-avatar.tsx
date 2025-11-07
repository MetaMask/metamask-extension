import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { AvatarAccountSize } from '@metamask/design-system-react';
import { CaipAccountId, parseCaipAccountId } from '@metamask/utils';
import { isEvmAccountType } from '@metamask/keyring-api';
import { PreferredAvatar } from '../../preferred-avatar';
import { getIsMultichainAccountsState2Enabled } from '../../../../selectors/multichain-accounts';
import { getAccountGroupsByAddress } from '../../../../selectors/multichain-accounts/account-tree';
import { MultichainAccountsState } from '../../../../selectors/multichain-accounts/account-tree.types';

type SnapUIAvatarProps = {
  // The address must be a CAIP-10 string.
  address: string;
  size?: AvatarAccountSize;
};

export const SnapUIAvatar: React.FunctionComponent<SnapUIAvatarProps> = ({
  address: caipAddress,
  size,
}) => {
  const { address } = useMemo(() => {
    return parseCaipAccountId(caipAddress as CaipAccountId);
  }, [caipAddress]);

  const useAccountGroups = useSelector(getIsMultichainAccountsState2Enabled);

  const accountGroups = useSelector((state: MultichainAccountsState) =>
    getAccountGroupsByAddress(state, [address]),
  );

  const accountGroupAddress = accountGroups[0]?.accounts.find((account) =>
    isEvmAccountType(account.type),
  )?.address;

  // Display the account group address if it exists as the default.
  const displayAddress =
    useAccountGroups && accountGroupAddress ? accountGroupAddress : caipAddress;

  return <PreferredAvatar address={displayAddress} size={size} />;
};
