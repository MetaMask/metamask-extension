import React from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';

import { useSelector } from 'react-redux';
import {
  AvatarAccount,
  AvatarAccountSize,
  AvatarAccountVariant,
  Box,
  Text,
} from '../../../component-library';
import { getUseBlockie } from '../../../../selectors';
import {
  AlignItems,
  BackgroundColor,
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';

export default function ConnectedAccountsListItem({
  address,
  className = null,
  name,
  status,
  action = null,
  options = null,
  backgroundColor,
}) {
  const useBlockie = useSelector(getUseBlockie);
  const containerbackgroundColor =
    backgroundColor || BackgroundColor.backgroundDefault;
  return (
    <Box
      className={classnames('connected-accounts-list__row', className)}
      padding={4}
      backgroundColor={containerbackgroundColor}
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      justifyContent={JustifyContent.spaceBetween}
      alignItems={AlignItems.center}
    >
      <Box className="connected-accounts-list__row-content" gap={4}>
        <AvatarAccount
          variant={
            useBlockie
              ? AvatarAccountVariant.Blockies
              : AvatarAccountVariant.Jazzicon
          }
          address={address}
          size={AvatarAccountSize.Md}
        />
        <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
          <Box>
            <Text
              variant={TextVariant.bodyLgMedium}
              className="connected-accounts-list__account-name"
            >
              {name}
            </Text>
            {status ? (
              <Text
                variant={TextVariant.bodyLgMedium}
                className="connected-accounts-list__account-status"
                color={TextColor.successDefault}
              >
                {status}
              </Text>
            ) : null}
          </Box>
          <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
            {action}
          </Box>
        </Box>
      </Box>
      {options}
    </Box>
  );
}
ConnectedAccountsListItem.propTypes = {
  address: PropTypes.string.isRequired,
  className: PropTypes.string,
  name: PropTypes.node.isRequired,
  status: PropTypes.string,
  action: PropTypes.node,
  options: PropTypes.node,
  backgroundColor: PropTypes.string,
};
