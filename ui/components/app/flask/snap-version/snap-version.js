import React from 'react';
import PropTypes from 'prop-types';
import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  Color,
  FLEX_DIRECTION,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box';
import {
  BUTTON_TYPES,
  Button,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../component-library';

const SnapVersion = ({ version, url }) => (
  <Button
    type={BUTTON_TYPES.LINK}
    href={url}
    target="_blank"
    className="snap-version"
  >
    <Box
      className="snap-version__wrapper"
      flexDirection={FLEX_DIRECTION.ROW}
      alignItems={AlignItems.center}
      backgroundColor={BackgroundColor.backgroundAlternative}
      borderRadius={BorderRadius.pill}
      paddingTop={1}
      paddingBottom={1}
      paddingLeft={2}
      paddingRight={2}
    >
      <Text
        color={Color.textAlternative}
        variant={TextVariant.bodyMd}
        paddingRight={1}
      >
        {`v${version}`}
      </Text>
      <Icon
        name={IconName.Export}
        color={Color.textAlternative}
        size={IconSize.Sm}
      />
    </Box>
  </Button>
);

SnapVersion.propTypes = {
  /**
   * The version of the snap
   */
  version: PropTypes.string,
  /**
   * The url to the snap package
   */
  url: PropTypes.string,
};

export default SnapVersion;
