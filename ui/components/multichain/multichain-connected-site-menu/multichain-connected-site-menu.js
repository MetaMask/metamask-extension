import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useSelector } from 'react-redux';
import {
  BackgroundColor,
  BorderColor,
  BorderRadius,
  IconColor,
  Size,
} from '../../../helpers/constants/design-system';
import { BadgeWrapper, Icon, ICON_NAMES } from '../../component-library';
import Box from '../../ui/box';
import { getSelectedIdentity } from '../../../selectors';
import Tooltip from '../../ui/tooltip';
import { useI18nContext } from '../../../hooks/useI18nContext';

export const MultichainConnectedSiteMenu = ({
  className,
  globalMenuColor,
  status,
  text,
}) => {
  const t = useI18nContext();
  const selectedAccount = useSelector(getSelectedIdentity);
  return (
    <Box
      className={classNames('multichain-connected-site-menu', className)}
      data-testid="connection-menu"
    >
      <Tooltip
        title={
          status === 'STATUS_NOT_CONNECTED'
            ? t('statusNotConnectedAccount')
            : `${selectedAccount?.name} ${text?.toLowerCase()}`
        }
        data-testid="multichain-connected-site-menu__tooltip"
        position="bottom"
      >
        <BadgeWrapper
          positionObj={
            status === 'STATUS_CONNECTED_TO_ANOTHER_ACCOUNT'
              ? { bottom: 4, right: -1, zIndex: 1 }
              : { bottom: 2, right: -4, zIndex: 1 }
          }
          badge={
            <Box
              backgroundColor={globalMenuColor}
              className={`multichain-connected-site-menu__badge ${
                status === 'STATUS_CONNECTED_TO_ANOTHER_ACCOUNT'
                  ? 'not-connected'
                  : ''
              }`}
              borderRadius={BorderRadius.full}
              borderColor={
                status === 'STATUS_CONNECTED_TO_ANOTHER_ACCOUNT'
                  ? BorderColor.successDefault
                  : BackgroundColor.backgroundDefault
              }
              borderWidth={
                status === 'STATUS_CONNECTED_TO_ANOTHER_ACCOUNT' ? 2 : 3
              }
            />
          }
        >
          <Icon
            name={ICON_NAMES.GLOBAL}
            size={Size.LG}
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
