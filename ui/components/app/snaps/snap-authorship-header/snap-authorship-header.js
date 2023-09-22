import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { getSnapPrefix } from '@metamask/snaps-utils';
import { useSelector } from 'react-redux';
import {
  BackgroundColor,
  TextColor,
  FlexDirection,
  TextVariant,
  AlignItems,
  Display,
  BlockSize,
  FontWeight,
} from '../../../../helpers/constants/design-system';
import {
  getSnapName,
  removeSnapIdPrefix,
} from '../../../../helpers/utils/util';

import { Text, Box } from '../../../component-library';
import { getTargetSubjectMetadata } from '../../../../selectors';
import SnapAvatar from '../snap-avatar';
import SnapVersion from '../snap-version/snap-version';

const SnapAuthorshipHeader = ({
  snapId,
  className,
  boxShadow = 'var(--shadow-size-lg) var(--color-shadow-default)',
}) => {
  // We're using optional chaining with snapId, because with the current implementation
  // of snap update in the snap controller, we do not have reference to snapId when an
  // update request is rejected because the reference comes from the request itself and not subject metadata
  // like it is done with snap install
  const snapPrefix = snapId && getSnapPrefix(snapId);
  const packageName = snapId && removeSnapIdPrefix(snapId);
  const isNPM = snapPrefix === 'npm:';

  const subjectMetadata = useSelector((state) =>
    getTargetSubjectMetadata(state, snapId),
  );

  const versionPath = subjectMetadata?.version
    ? `/v/${subjectMetadata?.version}`
    : '';
  const url = isNPM
    ? `https://www.npmjs.com/package/${packageName}${versionPath}`
    : packageName;

  const friendlyName = snapId && getSnapName(snapId, subjectMetadata);

  return (
    <Box
      className={classnames('snaps-authorship-header', className)}
      backgroundColor={BackgroundColor.backgroundDefault}
      width={BlockSize.Full}
      alignItems={AlignItems.center}
      display={Display.Flex}
      padding={4}
      style={{
        boxShadow,
      }}
    >
      <Box>
        <SnapAvatar snapId={snapId} />
      </Box>
      <Box
        marginLeft={4}
        marginRight={4}
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
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
  boxShadow: PropTypes.string,
};

export default SnapAuthorshipHeader;
