import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { stripSnapPrefix } from '@metamask/snaps-utils';
import { useSelector } from 'react-redux';
import {
  BackgroundColor,
  TextColor,
  TextVariant,
  AlignItems,
  FontWeight,
  Display,
  FlexDirection,
  BlockSize,
  BorderColor,
  BorderRadius,
} from '../../../../helpers/constants/design-system';

import { Box, Text } from '../../../component-library';
import { getSnapMetadata } from '../../../../selectors';
import { SnapIcon } from '../snap-icon';

const SnapLegacyAuthorshipHeader = ({
  snapId,
  className,
  marginLeft,
  marginRight,
}) => {
  const packageName = snapId && stripSnapPrefix(snapId);
  const { name: snapName } = useSelector((state) =>
    getSnapMetadata(state, snapId),
  );

  return (
    <Box
      className={classnames('snap-legacy-authorship-header', className)}
      backgroundColor={BackgroundColor.backgroundDefault}
      width={BlockSize.Full}
      alignItems={AlignItems.center}
      display={Display.Flex}
      padding={2}
      borderColor={BorderColor.borderDefault}
      borderRadius={BorderRadius.pill}
      marginLeft={marginLeft}
      marginRight={marginRight}
    >
      <Box>
        <SnapIcon snapId={snapId} />
      </Box>
      <Box
        marginLeft={4}
        marginRight={4}
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        style={{ overflow: 'hidden' }}
      >
        <Text ellipsis fontWeight={FontWeight.Medium}>
          {snapName}
        </Text>
        <Text
          ellipsis
          variant={TextVariant.bodySm}
          color={TextColor.textAlternative}
        >
          {packageName}
        </Text>
      </Box>
    </Box>
  );
};

SnapLegacyAuthorshipHeader.propTypes = {
  /**
   * The id of the snap
   */
  snapId: PropTypes.string,
  /**
   * The className of the SnapLegacyAuthorshipHeader
   */
  className: PropTypes.string,
  marginLeft: PropTypes.number,
  marginRight: PropTypes.number,
};

export default SnapLegacyAuthorshipHeader;
