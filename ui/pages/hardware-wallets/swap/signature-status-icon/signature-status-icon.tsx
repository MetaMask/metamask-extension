import React from 'react';
import {
  Box,
  BoxBackgroundColor,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';

import { isErrorStepStatus } from '../hardware-wallet-signatures.utils';
import { SignatureStepStatus } from '../types';

const STEP_ICON_CLASSNAME =
  'flex size-8 shrink-0 items-center justify-center rounded-full';

/**
 * Displays the visual marker for a hardware wallet signature step. Completed
 * steps show a check, interrupted steps show an error icon, active steps show a
 * spinner, and pending steps show their sequence number.
 *
 * @param props - Component props.
 * @param props.status - Display status for the signature step.
 * @param props.stepNumber - Sequence number shown while the step is pending or active.
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
        className={STEP_ICON_CLASSNAME}
        backgroundColor={BoxBackgroundColor.PrimaryMuted}
      >
        <Icon
          name={IconName.Check}
          size={IconSize.Sm}
          color={IconColor.SuccessDefault}
        />
      </Box>
    );
  }

  if (isErrorStepStatus(status)) {
    return (
      <Box
        className={STEP_ICON_CLASSNAME}
        backgroundColor={BoxBackgroundColor.ErrorMuted}
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
        className={STEP_ICON_CLASSNAME}
        backgroundColor={BoxBackgroundColor.BackgroundMuted}
      >
        <Icon
          name={IconName.Loading}
          size={IconSize.Sm}
          color={IconColor.IconDefault}
          className="animate-spin"
        />
      </Box>
    );
  }

  return (
    <Box
      className={STEP_ICON_CLASSNAME}
      backgroundColor={BoxBackgroundColor.BackgroundMuted}
    >
      <Text variant={TextVariant.BodyXs} color={TextColor.TextDefault}>
        {stepNumber}
      </Text>
    </Box>
  );
};

export default SignatureStatusIcon;
