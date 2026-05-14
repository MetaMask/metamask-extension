import React from 'react';
import PropTypes from 'prop-types';

import {
  Color,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import { Text } from '../../../component-library';
import { SnapIcon } from '../snap-icon';

const SnapListItem = ({
  name,
  packageName,
  onClick,
  snapId,
  showUpdateDot,
}) => {
  return (
    <Box
      className="snap-list-item w-full"
      data-testid={snapId}
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      justifyContent={BoxJustifyContent.Between}
      padding={4}
      onClick={onClick}
    >
      <Box
        className="snap-list-item__inner-wrapper w-full"
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Start}
      >
        <Box>
          <SnapIcon snapId={snapId} />
        </Box>
        <Box
          paddingLeft={4}
          paddingRight={4}
          className="w-full"
          style={{ overflow: 'hidden' }}
        >
          <Text
            className="snap-list-item__title"
            color={Color.textDefault}
            variant={TextVariant.bodyMd}
            ellipsis
          >
            {name}
          </Text>
          <Text
            className="snap-list-item__url"
            color={Color.textAlternative}
            variant={TextVariant.bodySm}
            ellipsis
          >
            {packageName}
          </Text>
        </Box>
      </Box>
      {showUpdateDot && (
        <Box
          className="rounded-full"
          style={{ width: '10px', height: '10px', content: '' }}
          backgroundColor={BoxBackgroundColor.PrimaryDefault}
        />
      )}
    </Box>
  );
};

SnapListItem.propTypes = {
  /**
   * Name of the snap
   */
  name: PropTypes.string,
  /**
   * Name of a snap package
   */
  packageName: PropTypes.string,
  /**
   * onClick event handler
   */
  onClick: PropTypes.func,
  /**
   * ID of a snap.
   */
  snapId: PropTypes.string.isRequired,
  /**
   * Boolean value used as indicator for available update represented as a simple dot.
   */
  showUpdateDot: PropTypes.bool,
};
export default SnapListItem;
