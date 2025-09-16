import React from 'react';
import classnames from 'classnames';
import { AvatarAccountSize } from '@metamask/design-system-react';
import {
  AlignItems,
  BorderRadius,
  Display,
} from '../../../../helpers/constants/design-system';
import { Box } from '../../../component-library';
import { PreferredAvatar } from '../../../app/preferred-avatar';

type MultichainAccountAvatarGroupProps = {
  className?: string;
  limit?: number;
  members: { avatarValue: string; symbol?: string }[];
};

export const MultichainAccountAvatarGroup: React.FC<
  MultichainAccountAvatarGroupProps
> = ({ className = '', limit = 4, members = [] }): JSX.Element => {
  const visibleMembers = members.slice(0, limit).reverse();

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
              <PreferredAvatar
                data-testid={`avatar-account-${i}`}
                size={AvatarAccountSize.Xs}
                address={member.avatarValue}
              />
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
