import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { getSnapPrefix } from '@metamask/snaps-utils';
import { useSelector } from 'react-redux';
import Box from '../../../ui/box';
import {
  BackgroundColor,
  TextColor,
  FLEX_DIRECTION,
  TextVariant,
  AlignItems,
  DISPLAY,
  BLOCK_SIZES,
  FontWeight,
} from '../../../../helpers/constants/design-system';
import {
  getSnapName,
  removeSnapIdPrefix,
} from '../../../../helpers/utils/util';

import { Text } from '../../../component-library';
import { getTargetSubjectMetadata } from '../../../../selectors';
import SnapAvatar from '../snap-avatar';
import SnapVersion from '../snap-version/snap-version';

const SnapAuthorshipHeader = ({ snapId, className }) => {
  // We're using optional chaining with snapId, because with the current implementation
  // of snap update in the snap controller, we do not have reference to snapId when an
  // update request is rejected because the reference comes from the request itself and not subject metadata
  // like it is done with snap install
  const snapPrefix = snapId && getSnapPrefix(snapId);
  const packageName = snapId && removeSnapIdPrefix(snapId);
  const isNPM = snapPrefix === 'npm:';
  const url = isNPM
    ? `https://www.npmjs.com/package/${packageName}`
    : packageName;

  const subjectMetadata = useSelector((state) =>
    getTargetSubjectMetadata(state, snapId),
  );

  const friendlyName = snapId && getSnapName(snapId, subjectMetadata);

  return (
    <Box
      className={classnames('snaps-authorship-header', className)}
      backgroundColor={BackgroundColor.backgroundDefault}
      width={BLOCK_SIZES.FULL}
      alignItems={AlignItems.center}
      display={DISPLAY.FLEX}
      padding={4}
      style={{
        boxShadow: 'var(--shadow-size-lg) var(--color-shadow-default)',
      }}
    >
      <Box>
        <SnapAvatar snapId={snapId} />
      </Box>
      <Box
        marginLeft={4}
        marginRight={4}
        display={DISPLAY.FLEX}
        flexDirection={FLEX_DIRECTION.COLUMN}
        style={{ overflow: 'hidden' }}
      >
        <Text ellipsis fontWeight={FontWeight.Medium}>
          {friendlyName}
        </Text>
        <Text
          ellipsis
          variant={TextVariant.bodySm}
          color={TextColor.textAlternative}
        >
          {packageName}
        </Text>
      </Box>
      <Box marginLeft="auto">
        <SnapVersion version={subjectMetadata?.version} url={url} />
      </Box>
    </Box>
  );
};

SnapAuthorshipHeader.propTypes = {
  /**
   * The id of the snap
   */
  snapId: PropTypes.string,
  /**
   * The className of the SnapAuthorship
   */
  className: PropTypes.string,
};

export default SnapAuthorshipHeader;
