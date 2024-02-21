import React from 'react';
import classNames from 'classnames';
import { useSelector } from 'react-redux';
import {
  AlignItems,
  BackgroundColor,
  BorderColor,
  BorderRadius,
<<<<<<< HEAD
  Display,
  JustifyContent,
=======
  Color,
  Display,
  JustifyContent,
  Size,
>>>>>>> f7380e849e (converted components to typescript)
} from '../../../helpers/constants/design-system';
import {
  AvatarAccount,
  AvatarAccountSize,
  AvatarAccountVariant,
  BadgeWrapper,
  Box,
  BoxProps,
} from '../../component-library';
import { getUseBlockie } from '../../../selectors';
import Tooltip from '../../ui/tooltip';
import { BadgeStatusProps } from './badge-status.types';

export const BadgeStatus: React.FC<BadgeStatusProps> = ({
  className = '',
  badgeBackgroundColor = BackgroundColor.backgroundAlternative,
  badgeBorderColor = BorderColor.borderMuted,
  address,
  isConnectedAndNotActive = false,
  text,
  ...props
}): JSX.Element => {
  const useBlockie = useSelector(getUseBlockie);

  return (
    <Box
      className={classNames('multichain-badge-status', className)}
      data-testid="multichain-badge-status"
      as="button"
      display={Display.Flex}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.center}
      backgroundColor={BackgroundColor.backgroundDefault}
      {...(props as BoxProps<'div'>)}
    >
      <Tooltip
        title={text}
        data-testid="multichain-badge-status__tooltip"
        position="bottom"
      >
        <BadgeWrapper
          positionObj={
            isConnectedAndNotActive
<<<<<<< HEAD
              ? { bottom: 2, right: 5 }
              : { bottom: -1, right: 2 }
=======
              ? { bottom: 2, right: 5}
              : { bottom: -1, right: 2}
>>>>>>> f7380e849e (converted components to typescript)
          }
          badge={
            <Box
              className={classNames('multichain-badge-status__badge', {
                'multichain-badge-status__badge-not-connected':
                  isConnectedAndNotActive,
              })}
              backgroundColor={badgeBackgroundColor}
              borderRadius={BorderRadius.full}
              borderColor={badgeBorderColor}
              borderWidth={isConnectedAndNotActive ? 2 : 4}
            />
          }
        >
          <AvatarAccount
            borderColor={BorderColor.transparent}
            size={AvatarAccountSize.Md}
            address={address}
            variant={
              useBlockie
                ? AvatarAccountVariant.Blockies
                : AvatarAccountVariant.Jazzicon
            }
            marginInlineEnd={2}
          />
        </BadgeWrapper>
      </Tooltip>
    </Box>
  );
};
<<<<<<< HEAD
=======

>>>>>>> f7380e849e (converted components to typescript)
