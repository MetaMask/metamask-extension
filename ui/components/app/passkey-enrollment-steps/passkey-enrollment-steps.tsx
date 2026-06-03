import React from 'react';
import {
  Box,
  Text,
  BoxAlignItems,
  BoxFlexDirection,
  FontWeight,
  TextVariant,
  TextColor,
  Icon,
  IconName,
  IconSize,
  IconColor,
} from '@metamask/design-system-react';

export type PasskeyEnrollmentStepStatus = 'idle' | 'loading' | 'success';

type PasskeyEnrollmentStepsProps = {
  registerStatus: PasskeyEnrollmentStepStatus;
  verifyStatus: PasskeyEnrollmentStepStatus;
  registerLabel: string;
  verifyLabel: string;
  className?: string;
};

function renderPasskeyStepIndicator(status: PasskeyEnrollmentStepStatus) {
  if (status === 'success') {
    return (
      <Box
        className="flex size-11 shrink-0 items-center"
        data-testid="passkey-step-indicator-success"
      >
        <Icon
          name={IconName.Confirmation}
          color={IconColor.SuccessDefault}
          size={IconSize.Lg}
        />
      </Box>
    );
  }

  if (status === 'loading') {
    return (
      <Box
        className="flex size-11 shrink-0 items-center"
        data-testid="passkey-step-indicator-loading"
      >
        <Icon
          name={IconName.Loading}
          color={IconColor.IconDefault}
          size={IconSize.Lg}
          className="animate-spin"
        />
      </Box>
    );
  }

  return (
    <Box
      className="flex size-11 shrink-0 items-center"
      data-testid="passkey-step-indicator-idle"
    >
      <Icon
        name={IconName.FullCircle}
        color={IconColor.IconMuted}
        size={IconSize.Lg}
      />
    </Box>
  );
}

function getStepTextColor(status: PasskeyEnrollmentStepStatus): TextColor {
  if (status === 'idle') {
    return TextColor.TextAlternative;
  }
  if (status === 'success') {
    return TextColor.SuccessDefault;
  }
  return TextColor.TextDefault;
}

function renderPasskeyStepRow(
  status: PasskeyEnrollmentStepStatus,
  label: string,
) {
  return (
    <Box flexDirection={BoxFlexDirection.Row} alignItems={BoxAlignItems.Center}>
      {renderPasskeyStepIndicator(status)}
      <Text
        variant={TextVariant.BodyMd}
        fontWeight={FontWeight.Regular}
        color={getStepTextColor(status)}
      >
        {label}
      </Text>
    </Box>
  );
}

export const PasskeyEnrollmentSteps = ({
  registerStatus,
  verifyStatus,
  registerLabel,
  verifyLabel,
  className,
}: PasskeyEnrollmentStepsProps) => {
  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      gap={2}
      className={className}
      data-testid="passkey-setup-steps"
      aria-busy={true}
    >
      {renderPasskeyStepRow(registerStatus, registerLabel)}
      {renderPasskeyStepRow(verifyStatus, verifyLabel)}
    </Box>
  );
};
