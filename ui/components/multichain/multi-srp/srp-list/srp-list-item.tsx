import React from 'react';
import { useSelector } from 'react-redux';
import { type AccountGroupId } from '@metamask/account-api';
import { AvatarAccountSize } from '@metamask/design-system-react';
import { PreferredAvatar } from '../../../app/preferred-avatar';
import {
  Display,
  FlexDirection,
  AlignItems,
  JustifyContent,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { getIconSeedAddressByAccountGroupId } from '../../../../selectors/multichain-accounts/account-tree';
import { Text, Box } from '../../../component-library';

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
  const accountGroupName = useSelector((state) =>
    getAccountGroupNameByInternalAccount(state, account),
  );

  return (
    <Box
      key={accountId}
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.spaceBetween}
    >
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        alignItems={AlignItems.center}
      >
        <PreferredAvatar
          address={seedAddress}
          size={AvatarAccountSize.Xs}
          data-testid="avatar"
        />
        <Text
          className="srp-list__account-name"
          variant={TextVariant.bodySm}
          ellipsis
          paddingInlineStart={5}
        >
          {accountName}
        </Text>
      </Box>
      <Text variant={TextVariant.bodySm}>{balance}</Text>
    </Box>
  );
};
