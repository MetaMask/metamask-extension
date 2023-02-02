import React from 'react';
import PropTypes from 'prop-types';
import Box from '../../../ui/box';
import IconCopied from '../../../ui/icon/icon-copied';
import IconCopy from '../../../ui/icon/icon-copy';
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
} from '../../../../helpers/constants/design-system';
import { useCopyToClipboard } from '../../../../hooks/useCopyToClipboard';

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
          <IconCopied
            color="var(--color-icon-alternative)"
            className="copyable__icon"
            size={18}
          />
        ) : (
          <IconCopy
            className="copyable__icon"
            color="var(--color-icon-alternative)"
            onClick={() => handleCopy(text)}
            size={18}
          />
        )}
      </Box>
    </Box>
  );
};

Copyable.propTypes = {
  text: PropTypes.string,
};
