import React from 'react';
import classnames from 'classnames';
import { AvatarAccountSize } from '@metamask/design-system-react';
import {
  TextColor,
  TextVariant,
  AlignItems,
  BorderRadius,
  Display,
} from '../../../../helpers/constants/design-system';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  Text,
} from '../../../component-library';
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
      alignItems={AlignItems.center}
      display={Display.Flex}
      className={classnames('multichain-avatar-group', className)}
      data-testid="avatar-group"
      gap={1}
    >
      <Box display={Display.Flex} alignItems={AlignItems.center} gap={1}>
        {visibleMembers.map((member, i) => {
          return (
            <Box borderRadius={BorderRadius.full} key={i}>
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
          display={Display.Flex}
          alignItems={AlignItems.center}
        >
          <Text variant={TextVariant.bodySm} color={TextColor.textAlternative}>
            {tagValue}
          </Text>
        </Box>
      )}
    </Box>
  );
};
