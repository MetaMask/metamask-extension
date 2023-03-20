import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { getSnapPrefix } from '@metamask/snaps-utils';
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
  AvatarFavicon,
  BadgeWrapper,
  BadgeWrapperPosition,
  ICON_NAMES,
  ICON_SIZES,
  AvatarIcon,
  Text,
  ButtonIcon,
} from '../../../component-library';

const SnapsAuthorshipPill = ({ snapId, className }) => {
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

  const friendlyName = getSnapName(snapId);

  return (
    <Box
      className={classnames('mm-tag-url', className)}
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
    >
      <Box>
        <BadgeWrapper
          badge={
            <AvatarIcon
              iconName={ICON_NAMES.SNAPS}
              size={ICON_SIZES.XS}
              backgroundColor={IconColor.infoDefault}
              iconProps={{
                size: ICON_SIZES.XS,
                color: IconColor.infoInverse,
              }}
            />
          }
          position={BadgeWrapperPosition.bottomRight}
        >
          <AvatarFavicon />
        </BadgeWrapper>
      </Box>
      <Box
        marginLeft={4}
        marginRight={2}
        display={DISPLAY.FLEX}
        flexDirection={FLEX_DIRECTION.COLUMN}
      >
        <Text>{friendlyName}</Text>
        <Text variant={TextVariant.bodySm} color={TextColor.textAlternative}>
          {snapId}
        </Text>
      </Box>
      <ButtonIcon
        rel="noopener noreferrer"
        target="_blank"
        href={url}
        iconName={ICON_NAMES.EXPORT}
        color={IconColor.infoDefault}
        size={ICON_SIZES.MD}
      />
    </Box>
  );
};

SnapsAuthorshipPill.propTypes = {
  /**
   * The id of the snap
   */
  snapId: PropTypes.string,
  /**
   * The className of the SnapsAuthorshipPill
   */
  className: PropTypes.string,
};

export default SnapsAuthorshipPill;
