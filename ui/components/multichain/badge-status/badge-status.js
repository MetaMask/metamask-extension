import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useSelector } from 'react-redux';
import {
  AlignItems,
  BackgroundColor,
  BorderColor,
  BorderRadius,
  Color,
  Display,
  JustifyContent,
  Size,
} from '../../../helpers/constants/design-system';
import {
  AvatarAccount,
  AvatarAccountVariant,
  BadgeWrapper,
  Box,
} from '../../component-library';
import { getUseBlockie } from '../../../selectors';
import Tooltip from '../../ui/tooltip';

export const BadgeStatus = ({
  className = '',
  badgeBackgroundColor = Color.borderMuted,
  badgeBorderColor = BackgroundColor.backgroundDefault,
  address,
  isConnectedAndNotActive = false,
  text,
}) => {
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
    >
      <Tooltip
        title={text}
        data-testid="multichain-badge-status__tooltip"
        position="bottom"
      >
        <BadgeWrapper
          positionObj={
            isConnectedAndNotActive
              ? { bottom: 2, right: 5, zIndex: 1 }
              : { bottom: -1, right: 2, zIndex: 1 }
          }
          badge={
            <Box
              className={classNames('multichain-badge-status__badge', {
                'not-connected': isConnectedAndNotActive,
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
            size={Size.MD}
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

BadgeStatus.propTypes = {
  /**
   * Additional classNames to be added to the BadgeStatus
   */
  className: PropTypes.string,
  /**
   * Border color based on the connection status
   */
  badgeBorderColor: PropTypes.string.isRequired,
  /**
   * Background Color of Badge
   */
  badgeBackgroundColor: PropTypes.string.isRequired,
  /**
   * Connection status message on Tooltip
   */
  text: PropTypes.string,
  /**
   * To determine connection status
   */
  isConnectedAndNotActive: PropTypes.bool,
  /**
   * Address for AvatarAccount
   */
  address: PropTypes.string.isRequired,
};
