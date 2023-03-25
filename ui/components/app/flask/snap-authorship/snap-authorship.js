import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { getSnapPrefix } from '@metamask/snaps-utils';
import { useSelector } from 'react-redux';
import Box from '../../../ui/box';
import {
  BackgroundColor,
  TextColor,
  IconColor,
  FLEX_DIRECTION,
  TextVariant,
  BorderColor,
  AlignItems,
  DISPLAY,
  BorderRadius,
} from '../../../../helpers/constants/design-system';
import {
  getSnapName,
  removeSnapIdPrefix,
} from '../../../../helpers/utils/util';
import {
  IconName,
  IconSize,
  Text,
  ButtonIcon,
} from '../../../component-library';
import { getTargetSubjectMetadata } from '../../../../selectors';
import SnapAvatar from '../snap-avatar';

const SnapAuthorship = ({ snapId, className }) => {
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
      className={classnames('snaps-authorship', className)}
      backgroundColor={BackgroundColor.backgroundDefault}
      borderColor={BorderColor.borderDefault}
      borderWidth={1}
      alignItems={AlignItems.center}
      paddingLeft={2}
      paddingTop={2}
      paddingBottom={2}
      paddingRight={4}
      borderRadius={BorderRadius.pill}
      display={DISPLAY.FLEX}
      style={{ maxWidth: 'fit-content', width: '100%' }}
    >
      <Box>
        <SnapAvatar snapId={snapId} />
      </Box>
      <Box
        marginLeft={4}
        marginRight={2}
        display={DISPLAY.FLEX}
        flexDirection={FLEX_DIRECTION.COLUMN}
        style={{ overflow: 'hidden' }}
      >
        <Text ellipsis>{friendlyName}</Text>
        <Text
          ellipsis
          variant={TextVariant.bodySm}
          color={TextColor.textAlternative}
        >
          {packageName}
        </Text>
      </Box>
      <ButtonIcon
        rel="noopener noreferrer"
        target="_blank"
        href={url}
        iconName={IconName.Export}
        color={IconColor.infoDefault}
        size={IconSize.Md}
      />
    </Box>
  );
};

SnapAuthorship.propTypes = {
  /**
   * The id of the snap
   */
  snapId: PropTypes.string,
  /**
   * The className of the SnapAuthorship
   */
  className: PropTypes.string,
};

export default SnapAuthorship;
