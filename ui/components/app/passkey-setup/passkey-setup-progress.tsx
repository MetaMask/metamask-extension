import React from 'react';
import {
  FontWeight,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  PasskeyEnrollmentSteps,
  type PasskeyEnrollmentStepStatus,
} from '../passkey-enrollment-steps';

type PasskeySetupProgressProps = {
  passkeyMethodLabel: string;
  passkeyMethodSpecificLabel: string;
  registerStatus: PasskeyEnrollmentStepStatus;
  verifyStatus: PasskeyEnrollmentStepStatus;
};

/**
 * Shows passkey registration and verification progress.
 *
 * @param options0 - Component props.
 * @param options0.passkeyMethodLabel - OS-specific passkey method label.
 * @param options0.passkeyMethodSpecificLabel - Specific passkey method label.
 * @param options0.registerStatus - Registration step status.
 * @param options0.verifyStatus - Verification step status.
 */
export function PasskeySetupProgress({
  passkeyMethodLabel,
  passkeyMethodSpecificLabel,
  registerStatus,
  verifyStatus,
}: PasskeySetupProgressProps) {
  const t = useI18nContext() as (
    key: string,
    substitutions?: string[],
  ) => string;

  return (
    <>
      <Text
        variant={TextVariant.HeadingLg}
        fontWeight={FontWeight.Medium}
        color={TextColor.TextDefault}
      >
        {t('settingUpPasskey', [passkeyMethodLabel])}
      </Text>
      <PasskeyEnrollmentSteps
        registerStatus={registerStatus}
        verifyStatus={verifyStatus}
        registerLabel={t('passkeySetupStepRegister', [
          passkeyMethodSpecificLabel,
        ])}
        verifyLabel={t('passkeySetupStepVerify', [passkeyMethodSpecificLabel])}
        className="w-full"
      />
    </>
  );
}
