import React from 'react';
import PropTypes from 'prop-types';
import Box from '../../../ui/box';
import Typography from '../../../ui/typography';
import {
  AlignItems,
  BorderRadius,
  JustifyContent,
  OVERFLOW_WRAP,
  FLEX_DIRECTION,
  TypographyVariant,
  BackgroundColor,
  TextColor,
  Color,
} from '../../../../helpers/constants/design-system';
import { useCopyToClipboard } from '../../../../hooks/useCopyToClipboard';
import {
  Icon,
  ICON_NAMES,
  ICON_SIZES,
} from '../../../component-library/icon/deprecated';

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
      <Typography
        variant={TypographyVariant.H6}
        color={TextColor.textAlternative}
        marginRight={2}
        overflowWrap={OVERFLOW_WRAP.ANYWHERE}
      >
        {text}
      </Typography>
      <Box
        flexDirection={FLEX_DIRECTION.COLUMN}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.flexStart}
        marginTop={2}
        marginBottom={1}
      >
        {copied ? (
          <Icon
            name={ICON_NAMES.COPY_SUCCESS}
            size={ICON_SIZES.LG}
            color={Color.iconAlternative}
          />
        ) : (
          <Icon
            name={ICON_NAMES.COPY}
            size={ICON_SIZES.LG}
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
