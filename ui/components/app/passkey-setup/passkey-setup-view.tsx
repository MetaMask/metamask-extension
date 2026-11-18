import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import { PasskeySetupProgress } from './passkey-setup-progress';
import { PasskeySetupPrompt } from './passkey-setup-prompt';
import type {
  PasskeySetupOperation,
  SetupPasskeyContentProps,
} from './passkey-setup.types';
import { usePasskeySetupFlow } from './use-passkey-setup-flow';

type PasskeySetupViewProps = SetupPasskeyContentProps & {
  setupPasskey: PasskeySetupOperation;
};

/**
 * Shared passkey setup layout for enrollment and PRF migration.
 *
 * @param props - Setup props and the selected passkey operation.
 * @param props.setupPasskey - Enrollment or replacement ceremony.
 */
export function PasskeySetupView({
  setupPasskey,
  ...props
}: PasskeySetupViewProps) {
  const {
    enrollmentError,
    handleMaybeLater,
    handleSetupPasskey,
    isEnrollmentInProgress,
    isPasskeyRegistered,
    isPrfMigrationError,
    passkeyMethodLabel,
    passkeyMethodSpecificLabel,
    registerStepPhase,
    verifyStepPhase,
  } = usePasskeySetupFlow({
    ...props,
    setupPasskey,
  });

  if (isPasskeyRegistered && !isEnrollmentInProgress) {
    return null;
  }

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      gap={4}
      className="h-full"
      data-testid="parent-selector-setup-passkey"
    >
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Center}
        alignItems={BoxAlignItems.Center}
        className="my-8"
      >
        <img
          src="images/biometric.png"
          alt="Biometrics"
          width={200}
          height={200}
        />
      </Box>

      {isEnrollmentInProgress ? (
        <PasskeySetupProgress
          passkeyMethodLabel={passkeyMethodLabel}
          passkeyMethodSpecificLabel={passkeyMethodSpecificLabel}
          registerStatus={registerStepPhase}
          verifyStatus={verifyStepPhase}
        />
      ) : (
        <PasskeySetupPrompt
          enrollmentError={enrollmentError}
          isPrfMigrationError={isPrfMigrationError}
          passkeyMethodLabel={passkeyMethodLabel}
          passkeyMethodSpecificLabel={passkeyMethodSpecificLabel}
          onSetup={handleSetupPasskey}
          onSkip={handleMaybeLater}
        />
      )}
    </Box>
  );
}
