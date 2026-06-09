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

import PulseLoader from '../../../../components/ui/pulse-loader';
import { SignatureStepStatus } from '../types';

/**
 * Displays the visual marker for a hardware wallet signature step. Completed
 * steps show a check, interrupted steps show an error icon, active steps show a
 * loader, and pending steps show their sequence number.
 *
 * @param props - Component props.
 * @param props.status - Display status for the signature step.
 * @param props.stepNumber - Sequence number shown while the step is pending.
 */
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
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Center}
      >
        <PulseLoader />
      </Box>
    );
  }

  return (
    <Box
      alignItems={BoxAlignItems.Center}
      justifyContent={BoxJustifyContent.Center}
    >
      {stepNumber}
    </Box>
  );
};

export default SignatureStatusIcon;
