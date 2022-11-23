import React from 'react';
import Box from '../../../ui/box';
import IconCopied from '../../../ui/icon/icon-copied';
import IconCopy from '../../../ui/icon/icon-copy';
import Typography from '../../../ui/typography';
import {
  ALIGN_ITEMS,
  BORDER_RADIUS,
  COLORS,
  JUSTIFY_CONTENT,
  OVERFLOW_WRAP,
  FLEX_DIRECTION,
} from '../../../../helpers/constants/design-system';
import { useCopyToClipboard } from '../../../../hooks/useCopyToClipboard';

export const Copyable = ({ text }: { text: string }) => {
  const [copied, handleCopy] = useCopyToClipboard();
  return (
    <Box
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
          <IconCopied color="var(--color-icon-alternative)" size={18} />
        ) : (
          <IconCopy
            color="var(--color-icon-alternative)"
            onClick={() => handleCopy(text)}
            size={18}
          />
        )}
      </Box>
    </Box>
  );
};
