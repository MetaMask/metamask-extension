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
    <div className="signature-request-siwe-icon">
      <Box
        className="signature-request-siwe-icon__icon"
        display={DISPLAY.INLINE_FLEX}
        alignItems={ALIGN_ITEMS.CENTER}
        backgroundColor={COLORS.ERROR_DEFAULT}
        justifyContent={JUSTIFY_CONTENT.CENTER}
      >
        <Icon name={ICON_NAMES.DANGER_FILLED} color={COLORS.ERROR_INVERSE} />
      </Box>
    </div>
  );
};

export default SignatureRequestSIWEIcon;
