import React from 'react';
import PropTypes from 'prop-types';
import Box from '../../../ui/box';
import {
  AlignItems,
  BorderRadius,
  JustifyContent,
  OverflowWrap,
  FLEX_DIRECTION,
  TextVariant,
  BackgroundColor,
  TextColor,
  Color,
} from '../../../../helpers/constants/design-system';
import { useCopyToClipboard } from '../../../../hooks/useCopyToClipboard';
import { Icon, IconName, IconSize, Text } from '../../../component-library';

export const Copyable = ({ text }) => {
  const [copied, handleCopy] = useCopyToClipboard();
  return (
    <Box
      className="copyable"
      backgroundColor={BackgroundColor.backgroundAlternative}
      alignItems={AlignItems.stretch}
      justifyContent={JustifyContent.spaceBetween}
      borderRadius={BorderRadius.SM}
      paddingLeft={4}
      paddingRight={4}
      paddingTop={2}
      paddingBottom={2}
    >
      <Text
        variant={TextVariant.bodySm}
        as="h6"
        color={TextColor.textAlternative}
        marginRight={2}
        overflowWrap={OverflowWrap.Anywhere}
      >
        {text}
      </Text>
      <Box
        flexDirection={FLEX_DIRECTION.COLUMN}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.flexStart}
        marginTop={2}
        marginBottom={1}
      >
        {copied ? (
          <Icon
            name={IconName.CopySuccess}
            size={IconSize.Lg}
            color={Color.iconAlternative}
          />
        ) : (
          <Icon
            name={IconName.Copy}
            size={IconSize.Lg}
            color={Color.iconAlternative}
            onClick={() => handleCopy(text)}
          />
        )}
      </Box>
    </Box>
  );
};

Copyable.propTypes = {
  text: PropTypes.string,
};
