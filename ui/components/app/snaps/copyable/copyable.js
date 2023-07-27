import React from 'react';
import PropTypes from 'prop-types';

import {
  AlignItems,
  BorderRadius,
  Display,
  JustifyContent,
  OverflowWrap,
  TextVariant,
  BackgroundColor,
  TextColor,
  IconColor,
} from '../../../../helpers/constants/design-system';
import { useCopyToClipboard } from '../../../../hooks/useCopyToClipboard';
import { IconName, Text, Box, ButtonIcon } from '../../../component-library';

export const Copyable = ({ text }) => {
  const [copied, handleCopy] = useCopyToClipboard();
  return (
    <Box
      className="copyable"
      display={Display.Flex}
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
        color={TextColor.textAlternative}
        marginRight={2}
        overflowWrap={OverflowWrap.Anywhere}
      >
        {text}
      </Text>
      <ButtonIcon
        iconName={copied ? IconName.CopySuccess : IconName.Copy}
        color={IconColor.iconAlternative}
        onClick={() => handleCopy(text)}
      />
    </Box>
  );
};

Copyable.propTypes = {
  text: PropTypes.string,
};
