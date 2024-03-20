import * as React from 'react';
import classnames from 'classnames';
import { useSelector } from 'react-redux';
import { getUseBlockie } from '../../../selectors';
import {
  Text,
  Box,
  AvatarToken,
  AvatarTokenSize,
  AvatarAccount,
  AvatarAccountSize,
  AvatarAccountVariant,
} from '../../component-library';
import {
  AlignItems,
  BorderColor,
  BorderRadius,
  Display,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { AvatarGroupProps, AvatarType } from './avatar-group.types';

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  className = '',
  limit = 4,
  members = [],
  size = AvatarTokenSize.Xs,
  avatarType = AvatarType.TOKEN,
  borderColor = BorderColor.borderDefault,
}): JSX.Element => {
  const membersCount = members.length;
  const visibleMembers = members.slice(0, limit).reverse();
  const showTag = membersCount > limit;
  const useBlockie = useSelector(getUseBlockie);

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
        {visibleMembers.map((member, i) => {
          return (
            <Box
              borderRadius={BorderRadius.full}
              key={i}
              style={{ marginLeft: i === 0 ? '0' : marginLeftValue }}
            >
              {avatarType === AvatarType.TOKEN ? (
                <AvatarToken
                  src={member.avatarValue}
                  name={member.symbol}
                  size={size}
                  borderColor={borderColor}
                />
              ) : (
                <AvatarAccount
                  size={AvatarAccountSize.Xs}
                  address={member.avatarValue}
                  variant={
                    useBlockie
                      ? AvatarAccountVariant.Blockies
                      : AvatarAccountVariant.Jazzicon
                  }
                  borderColor={borderColor}
                />
              )}
            </Box>
          );
        })}
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
