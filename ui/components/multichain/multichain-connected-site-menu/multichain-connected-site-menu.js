import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useSelector } from 'react-redux';
import {
  BackgroundColor,
  BorderRadius,
  IconColor,
  Size,
} from '../../../helpers/constants/design-system';
import { BadgeWrapper, Icon, ICON_NAMES } from '../../component-library';
import Box from '../../ui/box';
import { getSelectedIdentity } from '../../../selectors';
import Tooltip from '../../ui/tooltip';

export const MultichainConnectedSiteMenu = ({
  className,
  globalMenuColor,
  status,
  text,
}) => {
  const selectedAccount = useSelector(getSelectedIdentity);
  return (
    <Box
      className={classNames('multichain-connected-site-menu', className)}
      data-testid="connection-menu"
    >
      <Tooltip
        title={
          status === 'STATUS_NOT_CONNECTED'
            ? text
            : `${selectedAccount?.name} ${text.toLowerCase()}`
        }
        data-testid="multichain-connected-site-menu'__tooltip"
        position="bottom"
      >
        <BadgeWrapper
          badge={
            <Box
              backgroundColor={globalMenuColor}
              className="multichain-connected-site-menu__badge"
              borderRadius={BorderRadius.full}
              borderColor={BackgroundColor.backgroundDefault}
              borderWidth={3}
              style={{ width: 12, height: 12 }} // TODO: Remove this once we have the multichain folder to include scss
            />
          }
        >
          <Icon
            name={ICON_NAMES.GLOBAL}
            size={Size.XL}
            color={IconColor.iconDefault}
          />
        </BadgeWrapper>
      </Tooltip>
    </Box>
  );
};

MultichainConnectedSiteMenu.propTypes = {
  /**
   * Additional classNames to be added to the MultichainConnectedSiteMenu
   */
  className: PropTypes.string,
  /**
   * Background color based on the connection status
   */
  globalMenuColor: PropTypes.string.isRequired,
  /**
   * Connection status string
   */
  status: PropTypes.string.isRequired,
  /**
   * Connection status message
   */
  text: PropTypes.string,
};
