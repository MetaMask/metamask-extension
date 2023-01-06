import React from 'react';
import {
  DISPLAY,
  ALIGN_ITEMS,
  COLORS,
  JUSTIFY_CONTENT,
} from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box';
import { Icon, ICON_NAMES } from '../../../component-library/icon';

const SignatureRequestSIWEIcon = () => {
  return (
    <Box
      className="signature-request-siwe-icon"
      display={DISPLAY.INLINE_FLEX}
      alignItems={ALIGN_ITEMS.CENTER}
      backgroundColor={COLORS.ERROR_DEFAULT}
      justifyContent={JUSTIFY_CONTENT.CENTER}
    >
      <Icon name={ICON_NAMES.DANGER} color={COLORS.ERROR_INVERSE} />
    </Box>
  );
};

export default SignatureRequestSIWEIcon;
