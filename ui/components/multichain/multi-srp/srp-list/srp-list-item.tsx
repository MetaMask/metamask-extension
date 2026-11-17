import React from 'react';
import { useSelector } from 'react-redux';
import { type AccountGroupId } from '@metamask/account-api';
import {
  AvatarAccountSize,
  ContentVariant,
  ListItem,
  TextVariant,
} from '@metamask/design-system-react';
import { PreferredAvatar } from '../../../app/preferred-avatar';
import { getIconSeedAddressByAccountGroupId } from '../../../../selectors/multichain-accounts/account-tree';

type SrpListItemProps = {
  accountId: AccountGroupId;
  accountName: string;
  balance?: string;
};

export const SrpListItem = ({
  accountId,
  accountName,
  balance,
}: SrpListItemProps) => {
  const seedAddress = useSelector((state) =>
    getIconSeedAddressByAccountGroupId(state, accountId),
  );

  return (
    <ListItem
      key={accountId}
      variant={ContentVariant.OneLine}
      // The SRP card owns the row padding; ListItem's default padded row
      // chrome is stripped so the compact card rows keep their spacing.
      className="px-0 py-0 min-h-0"
      avatar={
        <PreferredAvatar
          address={seedAddress}
          size={AvatarAccountSize.Xs}
          data-testid="avatar"
        />
      }
      title={accountName}
      titleProps={{
        variant: TextVariant.BodySm,
        ellipsis: true,
        className: 'srp-list__account-name',
      }}
      value={balance}
      valueProps={{ variant: TextVariant.BodySm }}
    />
  );
};
