import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  Display,
  IconColor,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import { Box, Icon, IconName, IconSize } from '../../component-library';

export const ConnectedSiteMenu = ({ className, disabled, onClick }) => {
  return (
    <Box
      className={classNames(
        `multichain-connected-site-menu${disabled ? '--disabled' : ''}`,
        className,
      )}
      data-testid="connection-menu"
      as="button"
      display={Display.Flex}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.center}
      backgroundColor={BackgroundColor.backgroundDefault}
      onClick={onClick}
      borderRadius={BorderRadius.LG}
    >
      <Icon
        name={IconName.Global}
        size={IconSize.Lg}
        color={IconColor.iconDefault}
      />
    </Box>
  );
};

ConnectedSiteMenu.propTypes = {
  /**
   * Additional classNames to be added to the ConnectedSiteMenu
   */
  className: PropTypes.string,
  /**
   * onClick handler to be passed
   */
  onClick: PropTypes.func,
  /**
   *  Disable the connected site menu if the account is non-evm
   */
  disabled: PropTypes.bool,
};
