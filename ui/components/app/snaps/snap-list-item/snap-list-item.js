import React from 'react';
import PropTypes from 'prop-types';

import {
  Color,
  AlignItems,
  JustifyContent,
  Display,
  BlockSize,
  TextVariant,
  IconColor,
} from '../../../../helpers/constants/design-system';
import {
  Text,
  Box,
  IconName,
  IconSize,
  Icon,
} from '../../../component-library';
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
      className="snap-list-item"
      data-testid={snapId}
      display={Display.Flex}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.spaceBetween}
      width={BlockSize.Full}
      padding={4}
      onClick={onClick}
    >
      <Box
        className="snap-list-item__inner-wrapper"
        display={Display.Flex}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.flexStart}
        width={BlockSize.Full}
      >
        <Box>
          <SnapIcon snapId={snapId} />
        </Box>
        <Box
          paddingLeft={4}
          paddingRight={4}
          width={BlockSize.Full}
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
        <Box display={Display.Flex}>
          <Icon
            name={IconName.FullCircle}
            size={IconSize.Xs}
            color={IconColor.primaryDefault}
          />
        </Box>
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
