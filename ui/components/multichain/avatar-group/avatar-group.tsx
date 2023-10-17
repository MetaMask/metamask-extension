import * as React from 'react';
import classnames from 'classnames';
import {
  Text,
  Box,
  AvatarToken,
  AvatarTokenSize,
} from '../../component-library';
import {
  AlignItems,
  BorderColor,
  BorderRadius,
  Display,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { AvatarGroupProps } from './avatar-group.types';

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  className = '',
  limit = 4,
  members = [],
  size = AvatarTokenSize.Xs,
  borderColor = BorderColor.borderDefault,
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
      <Box display={Display.Flex}>
        {visibleMembers.map((member, i) => (
          <Box
            borderRadius={BorderRadius.full}
            key={member.symbol}
            style={
              i === 0 ? { marginLeft: '0' } : { marginLeft: marginLeftValue }
            }
          >
            <AvatarToken
              src={member.iconUrl}
              name={member.symbol}
              size={size}
              borderColor={borderColor}
            />
          </Box>
        ))}
      </Box>
      {showTag ? (
        <Box>
          <Text variant={TextVariant.bodySm} color={TextColor.textAlternative}>
            {tagValue}
          </Text>
        </Box>
      ) : null}
    </Box>
  );
};
