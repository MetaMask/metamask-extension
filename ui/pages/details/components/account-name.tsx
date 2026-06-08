import React from 'react';
import { useSelector } from 'react-redux';
import { shortenAddress } from '../../../helpers/utils/util';
import { selectAccountGroupNameByAddress } from '../../../selectors/multichain-accounts/account-tree';

export function AccountName({ address }: { address: string }) {
  const accountName = useSelector((state) =>
    selectAccountGroupNameByAddress(state, address),
  );
  const shortAddress = shortenAddress(address);

  return (
    <span>
      {accountName ? `${accountName} (${shortAddress})` : shortAddress}
    </span>
  );
}
