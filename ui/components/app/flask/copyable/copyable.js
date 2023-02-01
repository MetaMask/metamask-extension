import React from 'react';
import PropTypes from 'prop-types';
import Box from '../../../ui/box';
import Typography from '../../../ui/typography';
import {
  ALIGN_ITEMS,
  BORDER_RADIUS,
  COLORS,
  JUSTIFY_CONTENT,
  OVERFLOW_WRAP,
  FLEX_DIRECTION,
  TYPOGRAPHY,
} from '../../../../helpers/constants/design-system';
import { useCopyToClipboard } from '../../../../hooks/useCopyToClipboard';
import { Icon, ICON_NAMES, ICON_SIZES } from '../../../component-library';

export const Copyable = ({ text }) => {
  const [copied, handleCopy] = useCopyToClipboard();
  return (
    <Box
      className="copyable"
      backgroundColor={COLORS.BACKGROUND_ALTERNATIVE}
      alignItems={ALIGN_ITEMS.STRETCH}
      justifyContent={JUSTIFY_CONTENT.SPACE_BETWEEN}
      borderRadius={BORDER_RADIUS.SM}
      paddingLeft={4}
      paddingRight={4}
      paddingTop={2}
      paddingBottom={2}
    >
      <Typography
        variant={TYPOGRAPHY.H6}
        color={COLORS.TEXT_ALTERNATIVE}
        marginRight={2}
        overflowWrap={OVERFLOW_WRAP.ANYWHERE}
      >
        {text}
      </Typography>
      <Box
        flexDirection={FLEX_DIRECTION.COLUMN}
        alignItems={ALIGN_ITEMS.CENTER}
        justifyContent={JUSTIFY_CONTENT.FLEX_START}
        marginTop={2}
        marginBottom={1}
      >
        {copied ? (
          <Icon
            name={ICON_NAMES.COPY_SUCCESS}
            size={ICON_SIZES.LG}
            color={COLORS.ICON_ALTERNATIVE}
          />
        ) : (
          <Icon
            name={ICON_NAMES.COPY}
            size={ICON_SIZES.LG}
            color={COLORS.ICON_ALTERNATIVE}
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
