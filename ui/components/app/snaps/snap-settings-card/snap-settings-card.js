import React from 'react';
import PropTypes from 'prop-types';

import {
  Color,
  AlignItems,
  JustifyContent,
  Display,
  BlockSize,
  IconColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import {
  Icon,
  IconName,
  IconSize,
  Text,
  Box,
} from '../../../component-library';
import SnapAvatar from '../snap-avatar';

const SnapSettingsCard = ({ name, packageName, onClick, snapId }) => {
  return (
    <Box
      className="snap-settings-card"
      display={Display.Flex}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.spaceBetween}
      width={BlockSize.Full}
      padding={4}
    >
      <Box
        className="snap-settings-card__inner-wrapper"
        display={Display.Flex}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.flexStart}
        width={BlockSize.Full}
        onClick={onClick}
      >
        <Box>
          <SnapAvatar snapId={snapId} />
        </Box>
        <Box paddingLeft={4} paddingRight={4} width={BlockSize.Full}>
          <Text
            className="snap-settings-card__title"
            color={Color.textDefault}
            variant={TextVariant.bodyMd}
          >
            {name}
          </Text>
          <Text
            className="snap-settings-card__url"
            color={Color.textAlternative}
            variant={TextVariant.bodySm}
          >
            {packageName}
          </Text>
        </Box>
      </Box>
      <Box className="snap-settings-card__caret" onClick={onClick}>
        <Icon
          name={IconName.ArrowRight}
          size={IconSize.Md}
          color={IconColor.iconMuted}
        />
      </Box>
    </Box>
  );
};

SnapSettingsCard.propTypes = {
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
};
export default SnapSettingsCard;
