import React from 'react';
import classnames from 'clsx';
import PropTypes from 'prop-types';
import { shortenAddress } from '../../../../helpers/utils/util';

import { Box, BoxAlignItems, BoxBackgroundColor, BoxFlexDirection, BoxJustifyContent } from '@metamask/design-system-react';
import { Text } from '../../../component-library';
import { PreferredAvatar } from '../../preferred-avatar';
import {
  BackgroundColor,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';

// Map legacy BackgroundColor values to DSR BoxBackgroundColor
const LEGACY_BG_TO_DSR = {
  [BackgroundColor.backgroundDefault]: BoxBackgroundColor.BackgroundDefault,
  [BackgroundColor.warningMuted]: BoxBackgroundColor.WarningMuted,
};

export default function ConnectedAccountsListItem({
  address,
  className = null,
  name,
  status,
  action = null,
  options = null,
  backgroundColor,
}) {
  const legacyBg = backgroundColor ?? BackgroundColor.backgroundDefault;
  const containerbackgroundColor =
    LEGACY_BG_TO_DSR[legacyBg] ?? BoxBackgroundColor.BackgroundDefault;
  return (
    <Box
      className={classnames('flex connected-accounts-list__row', className)}
      padding={4}
      backgroundColor={containerbackgroundColor}
      flexDirection={BoxFlexDirection.Row}
      justifyContent={BoxJustifyContent.Between}
      alignItems={BoxAlignItems.Center}
    >
      <Box className="connected-accounts-list__row-content" gap={4}>
        <PreferredAvatar address={address} />
        <Box className="flex" flexDirection={BoxFlexDirection.Column}>
          <Box>
            <Text
              variant={TextVariant.bodyLgMedium}
              className="connected-accounts-list__account-name"
            >
              {name}
            </Text>
            <Text variant={TextVariant.bodyMd}>{shortenAddress(address)}</Text>
            {status ? (
              <Text
                variant={TextVariant.bodyMd}
                className="connected-accounts-list__account-status"
                color={TextColor.successDefault}
              >
                {status}
              </Text>
            ) : null}
          </Box>
          <Box className="flex" flexDirection={BoxFlexDirection.Column}>
            {action}
          </Box>
        </Box>
      </Box>
      {options}
    </Box>
  );
}
ConnectedAccountsListItem.propTypes = {
  /**
   * Address for Avatar
   */
  address: PropTypes.string.isRequired,
  /**
   * An additional className to apply
   */
  className: PropTypes.string,
  /**
   * Name of the account
   */
  name: PropTypes.node.isRequired,
  /**
   * Status showing connected, not connected and active state
   */
  status: PropTypes.string,
  /**
   * Action for account
   */
  action: PropTypes.node,
  /**
   * Render Options button with actions
   */
  options: PropTypes.node,
  /**
   * ContainerbackgroundColor showing highlighted state when not connected
   */
  backgroundColor: PropTypes.string,
};
