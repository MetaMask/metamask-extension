import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxJustifyContent,
  Icon,
  IconColor,
  IconName,
  IconSize,
} from '@metamask/design-system-react';

import PulseLoader from '../../../components/ui/pulse-loader';
import { SignatureStepStatus } from './hardware-wallet-signatures.utils';

const SignatureStatusIcon = ({
  status,
  stepNumber,
}: {
  status: SignatureStepStatus;
  stepNumber: number;
}) => {
  if (status === SignatureStepStatus.Complete) {
    return (
      <Box
        className="hardware-wallet-signatures__step-icon hardware-wallet-signatures__step-icon--complete"
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Center}
      >
        <Icon
          name={IconName.Check}
          size={IconSize.Sm}
          color={IconColor.SuccessDefault}
        />
      </Box>
    );
  }

  if (
    status === SignatureStepStatus.Rejected ||
    status === SignatureStepStatus.Failed ||
    status === SignatureStepStatus.Disconnected
  ) {
    return (
      <Box
        className="hardware-wallet-signatures__step-icon hardware-wallet-signatures__step-icon--rejected"
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Center}
      >
        <Icon
          name={IconName.CircleX}
          size={IconSize.Sm}
          color={IconColor.ErrorDefault}
        />
      </Box>
    );
  }

  if (status === SignatureStepStatus.Active) {
    return (
      <Box
        className="hardware-wallet-signatures__step-icon hardware-wallet-signatures__step-icon--active"
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Center}
      >
        <PulseLoader />
      </Box>
    );
  }

  return (
    <Box
      className="hardware-wallet-signatures__step-icon"
      alignItems={BoxAlignItems.Center}
      justifyContent={BoxJustifyContent.Center}
    >
      {stepNumber}
    </Box>
  );
};

export default SignatureStatusIcon;
