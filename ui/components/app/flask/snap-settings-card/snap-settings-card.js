import React from 'react';
import PropTypes from 'prop-types';

import Box from '../../../ui/box';

import {
  Color,
  AlignItems,
  JustifyContent,
  DISPLAY,
  BLOCK_SIZES,
  IconColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { Icon, IconName, IconSize, Text } from '../../../component-library';
import SnapAvatar from '../snap-avatar';

const SnapSettingsCard = ({ name, packageName, onClick, snapId }) => {
  return (
    <Box
      className="snap-settings-card"
      display={DISPLAY.FLEX}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.spaceBetween}
      width={BLOCK_SIZES.FULL}
      padding={[4, 4, 4, 4]}
    >
      <Box
        className="snap-settings-card__inner-wrapper"
        display={DISPLAY.FLEX}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.flexStart}
        width={BLOCK_SIZES.FULL}
        onClick={onClick}
      >
        <Box>
          <SnapAvatar snapId={snapId} />
        </Box>
        <Box paddingLeft={4} paddingRight={4} width={BLOCK_SIZES.FULL}>
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
   * Name of the snap used for the title of the card and fallback letter for the snap icon
   */
  name: PropTypes.string,
  /**
   * Name of a snap package
   */
  packageName: PropTypes.string,
  /**
   * onClick function of the "See Details" Button
   */
  onClick: PropTypes.func,
  /**
   * ID of a snap.
   */
  snapId: PropTypes.string.isRequired,
};

export default SnapSettingsCard;
