import React from 'react';
import { AvatarBaseSize } from '@metamask/design-system-shared';
import { useSelector } from 'react-redux';
import { shortenAddress } from '../../../helpers/utils/util';
import { selectAccountGroupNameByAddress } from '../../../selectors/multichain-accounts/account-tree';
import { PreferredAvatar } from '../preferred-avatar';

export function AccountName({ address }: { address?: string | null }) {
  const accountName = useSelector((state) =>
    selectAccountGroupNameByAddress(state, address ?? ''),
  );

  if (!address) {
    return null;
  }

  const shortAddress = shortenAddress(address);

  return (
    <div className="inline-flex items-center gap-2">
      <PreferredAvatar address={address} size={AvatarBaseSize.Xs} />

      <span data-address={address} data-testid="transaction-details-address">
        {accountName ? `${accountName} (${shortAddress})` : shortAddress}
      </span>
    </div>
  );
}
