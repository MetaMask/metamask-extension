import React from 'react';
import PropTypes from 'prop-types';

import { Box, ContentVariant, ListItem } from '@metamask/design-system-react';
import { SnapIcon } from '../snap-icon';

const SnapListItem = ({
  name,
  packageName,
  onClick,
  snapId,
  showUpdateDot,
}) => {
  return (
    <ListItem
      variant={ContentVariant.TwoLines}
      isInteractive
      onClick={onClick}
      className="snap-list-item"
      data-testid={snapId}
      avatar={<SnapIcon snapId={snapId} />}
      title={name}
      titleProps={{ ellipsis: true }}
      description={packageName}
      descriptionProps={{ ellipsis: true }}
      endAccessory={
        showUpdateDot ? (
          <Box className="size-2.5 rounded-full bg-primary-default" />
        ) : undefined
      }
    />
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
