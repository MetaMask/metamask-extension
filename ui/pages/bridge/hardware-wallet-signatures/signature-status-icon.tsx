import React from 'react';
import {
  Box,
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
      <Box className="hardware-wallet-signatures__step-icon hardware-wallet-signatures__step-icon--complete">
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
    status === SignatureStepStatus.Failed
  ) {
    return (
      <Box className="hardware-wallet-signatures__step-icon hardware-wallet-signatures__step-icon--rejected">
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
      <Box className="hardware-wallet-signatures__step-icon hardware-wallet-signatures__step-icon--active">
        <PulseLoader />
      </Box>
    );
  }

  return (
    <Box className="hardware-wallet-signatures__step-icon">{stepNumber}</Box>
  );
};

export default SignatureStatusIcon;
