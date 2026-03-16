import React, { useCallback, useState } from 'react';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../components/component-library';
import {
  AlignItems,
  BlockSize,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../helpers/constants/design-system';
import { useBiometricAuth } from '../../hooks/useBiometricAuth';
import BiometricEnrollmentModal from './biometric-enrollment-modal';

type BiometricUnlockButtonProps = {
  onPasswordRetrieved: (password: string) => Promise<void>;
  onSubmitPassword: (password: string) => Promise<void>;
  currentPassword: string;
  disabled?: boolean;
};

/**
 * Biometric unlock / enrollment button for the unlock page.
 *
 * - When enrolled: one-tap biometric unlock via WebAuthn PRF
 * - When not enrolled but supported: prompts enrollment using the
 *   password currently typed in the form
 */
export default function BiometricUnlockButton({
  onPasswordRetrieved,
  onSubmitPassword,
  currentPassword,
  disabled = false,
}: BiometricUnlockButtonProps) {
  const { isSupported, isEnrolled, isLoading, error, authenticate, enroll } =
    useBiometricAuth();
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);

  const handleClick = useCallback(async () => {
    if (isEnrolled) {
      const password = await authenticate();
      if (password) {
        await onPasswordRetrieved(password);
      }
    } else {
      if (!currentPassword) {
        setEnrollError('Enter your password above first, then tap here to enable biometrics.');
        return;
      }
      setEnrollError(null);
      setShowEnrollModal(true);
    }
  }, [isEnrolled, authenticate, onPasswordRetrieved, currentPassword]);

  const handleEnrolled = useCallback(async () => {
    setShowEnrollModal(false);
    // After enrollment, immediately authenticate to unlock
    const password = await authenticate();
    if (password) {
      await onPasswordRetrieved(password);
    }
  }, [authenticate, onPasswordRetrieved]);

  if (!isSupported || isLoading) {
    return null;
  }

  const displayError = error || enrollError;

  return (
    <>
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
        gap={2}
        width={BlockSize.Full}
        marginBottom={2}
      >
        <Box
          display={Display.Flex}
          alignItems={AlignItems.center}
          justifyContent={JustifyContent.center}
          width={BlockSize.Full}
          gap={4}
          marginBottom={2}
        >
          <Box
            as="hr"
            width={BlockSize.Full}
            style={{
              border: 'none',
              borderTop: '1px solid var(--color-border-muted)',
            }}
          />
          <Text
            variant={TextVariant.bodySm}
            color={TextColor.textAlternative}
            style={{ whiteSpace: 'nowrap' }}
          >
            or
          </Text>
          <Box
            as="hr"
            width={BlockSize.Full}
            style={{
              border: 'none',
              borderTop: '1px solid var(--color-border-muted)',
            }}
          />
        </Box>
        <Button
          variant={ButtonVariant.Secondary}
          size={ButtonSize.Lg}
          block
          onClick={handleClick}
          disabled={disabled}
          data-testid="biometric-unlock-button"
        >
          <Box
            display={Display.Flex}
            alignItems={AlignItems.center}
            gap={2}
          >
            <Icon
              name={IconName.SecurityKey}
              size={IconSize.Md}
              color={IconColor.primaryDefault}
            />
            {isEnrolled ? 'Unlock with biometrics' : 'Enable biometric unlock'}
          </Box>
        </Button>
        {displayError && (
          <Text
            variant={TextVariant.bodySm}
            color={TextColor.errorDefault}
            data-testid="biometric-error"
          >
            {displayError}
          </Text>
        )}
      </Box>
      {showEnrollModal && (
        <BiometricEnrollmentModal
          isOpen={showEnrollModal}
          password={currentPassword}
          onSubmitPassword={onSubmitPassword}
          onClose={() => setShowEnrollModal(false)}
          onEnrolled={handleEnrolled}
        />
      )}
    </>
  );
}
