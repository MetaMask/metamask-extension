import React from 'react';
import {
  Display,
  AlignItems,
  Color,
  JustifyContent,
} from '../../../../helpers/constants/design-system';
import { Icon, IconName, Box } from '../../../component-library';

const SignatureRequestSIWEIcon = () => {
  return (
    <Box
      className="signature-request-siwe-icon"
      display={Display.InlineFlex}
      alignItems={AlignItems.center}
      backgroundColor={Color.errorDefault}
      justifyContent={JustifyContent.center}
    >
      <Icon name={IconName.Danger} color={Color.errorInverse} />
    </Box>
  );
};

export default SignatureRequestSIWEIcon;
