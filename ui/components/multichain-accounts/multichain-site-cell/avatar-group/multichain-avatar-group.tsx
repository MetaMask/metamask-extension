import React from 'react';
import classnames from 'clsx';
import {
  AvatarAccountSize,
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { PreferredAvatar } from '../../../app/preferred-avatar';

export enum MultichainAvatarGroupType {
  ACCOUNT = 'ACCOUNT',
  NETWORK = 'NETWORK',
}

type MultichainAvatarGroupProps = {
  type: MultichainAvatarGroupType;
  className?: string;
  limit?: number;
  members: { avatarValue: string; symbol?: string }[];
};

export const MultichainAvatarGroup: React.FC<MultichainAvatarGroupProps> = ({
  type,
  className = '',
  limit = 4,
  members = [],
}): JSX.Element => {
  const visibleMembers = members.slice(0, limit);

  const showTag = members.length > limit;
  const tagValue = `+${(members.length - limit).toLocaleString()}`;

  return (
    <Box
      alignItems={BoxAlignItems.Center}
      flexDirection={BoxFlexDirection.Row}
      className={classnames('multichain-avatar-group', className)}
      data-testid="avatar-group"
      gap={1}
    >
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        gap={1}
      >
        {visibleMembers.map((member, i) => {
          return (
            <Box className="rounded-full overflow-hidden" key={i}>
              {type === MultichainAvatarGroupType.ACCOUNT && (
                <PreferredAvatar
                  data-testid={`avatar-${i}`}
                  size={AvatarAccountSize.Xs}
                  address={member.avatarValue}
                />
              )}
              {type === MultichainAvatarGroupType.NETWORK && (
                <AvatarNetwork
                  data-testid={`network-avatar-${i}`}
                  src={member.avatarValue}
                  name={member.symbol ?? ''}
                  size={AvatarNetworkSize.Xs}
                />
              )}
            </Box>
          );
        })}
      </Box>
      {showTag && (
        <Box
          paddingLeft={1}
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
        >
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            {tagValue}
          </Text>
        </Box>
      )}
    </Box>
  );
};
