import * as React from 'react';
import classnames from 'classnames';
import {
  AvatarAccount,
  AvatarAccountSize,
  AvatarAccountVariant,
} from '@metamask/design-system-react';
import { Text } from '../../component-library/text';
import {
  AlignItems,
  BackgroundColor,
  BorderColor,
  BorderRadius,
  Display,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  AvatarTokenSize,
  AvatarToken,
} from '../../component-library/avatar-token';
import { Box } from '../../component-library/box';
import {
  AvatarNetwork,
  AvatarNetworkSize,
} from '../../component-library/avatar-network';
import {
  AvatarBase,
  AvatarBaseSize,
} from '../../component-library/avatar-base';
import { AvatarGroupProps, AvatarType } from './avatar-group.types';

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  className = '',
  limit = 4,
  members = [],
  size = AvatarTokenSize.Xs,
  avatarType = AvatarType.TOKEN,
  borderColor,
  isTagOverlay = false,
  variant = AvatarAccountVariant.Maskicon,
}): JSX.Element => {
  const membersCount = members.length;
  const visibleMembers = members.slice(0, limit).reverse();
  const showTag = membersCount > limit;

  let marginLeftValue = '';
  if (AvatarTokenSize.Xs) {
    marginLeftValue = '-8px';
  } else if (AvatarTokenSize.Sm) {
    marginLeftValue = '-12px';
  } else {
    marginLeftValue = '-16px';
  }
  const tagValue = `+${(membersCount - limit).toLocaleString()}`;
  return (
    <Box
      alignItems={AlignItems.center}
      display={Display.Flex}
      className={classnames('multichain-avatar-group', className)}
      data-testid="avatar-group"
      gap={1}
    >
      <Box display={Display.Flex} alignItems={AlignItems.center}>
        {visibleMembers.map((member, i) => {
          return (
            <Box
              borderRadius={BorderRadius.full}
              key={i}
              style={{ marginLeft: i === 0 ? '0' : marginLeftValue }}
            >
              {avatarType === AvatarType.TOKEN && (
                <AvatarToken
                  src={member.avatarValue}
                  name={member.symbol}
                  size={size}
                  borderColor={borderColor}
                />
              )}
              {avatarType === AvatarType.ACCOUNT && (
                <AvatarAccount
                  size={AvatarAccountSize.Xs}
                  address={member.avatarValue}
                  variant={variant}
                />
              )}
              {avatarType === AvatarType.NETWORK && (
                <AvatarNetwork
                  src={member.avatarValue}
                  name={member.symbol ?? ''}
                  size={AvatarNetworkSize.Xs}
                />
              )}
            </Box>
          );
        })}
        {showTag && isTagOverlay && (
          <AvatarBase
            backgroundColor={BackgroundColor.overlayAlternative}
            style={{ marginLeft: marginLeftValue, fontSize: 8 }}
            size={AvatarBaseSize.Xs}
            borderColor={BorderColor.backgroundDefault}
            borderRadius={BorderRadius.MD}
            color={TextColor.overlayInverse}
          >
            {tagValue}
          </AvatarBase>
        )}
      </Box>
      {showTag && !isTagOverlay ? (
        <Box>
          <Text variant={TextVariant.bodySm} color={TextColor.textAlternative}>
            {tagValue}
          </Text>
        </Box>
      ) : null}
    </Box>
  );
};
