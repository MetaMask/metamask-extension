import React from 'react';
import { useSelector } from 'react-redux';
import { type AccountGroupId } from '@metamask/account-api';
import {
  AvatarAccountSize,
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import { PreferredAvatar } from '../../../app/preferred-avatar';
import { getIconSeedAddressByAccountGroupId } from '../../../../selectors/multichain-accounts/account-tree';

type SrpListItemProps = {
  accountId: AccountGroupId;
  accountName: string;
  balance: string;
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
    <Box
      key={accountId}
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      justifyContent={BoxJustifyContent.Between}
    >
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        gap={2}
      >
        <PreferredAvatar
          address={seedAddress}
          size={AvatarAccountSize.Xs}
          data-testid="avatar"
        />
        <Text
          className="srp-list__account-name"
          variant={TextVariant.BodySm}
          ellipsis
        >
          {accountName}
        </Text>
      </Box>
      <Text variant={TextVariant.BodySm}>{balance}</Text>
    </Box>
  );
};
