import React from 'react';
import PropTypes from 'prop-types';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  Display,
  FlexDirection,
} from '../../../../helpers/constants/design-system';
import { Box, Text } from '../../../component-library';

export const GatorPermissionItem = ({ permission, origin, onClick }) => {
  return (
    <Box
      data-testid="gator-permission-item"
      as="button"
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      alignItems={AlignItems.baseline}
      width={BlockSize.Full}
      backgroundColor={BackgroundColor.backgroundDefault}
      onClick={onClick}
      padding={4}
      gap={4}
      className="multichain-gator-permission-item"
    >
      <Text>Permission: {JSON.stringify(permission)}</Text>
      <Text>Origin: {origin}</Text>
    </Box>
  );
};

GatorPermissionItem.propTypes = {
  /**
   * The permission data to display
   */
  permission: PropTypes.object.isRequired,
  /**
   * The origin of the permission
   */
  origin: PropTypes.string.isRequired,
  /**
   * The function to call when the permission is clicked
   */
  onClick: PropTypes.func.isRequired,
};
