import React, { useCallback, useState } from 'react';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  Icon,
  IconName,
  IconSize,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from '../../components/component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  IconColor,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../helpers/constants/design-system';
import { useBiometricAuth } from '../../hooks/useBiometricAuth';

type BiometricEnrollmentModalProps = {
  isOpen: boolean;
  password: string;
  onSubmitPassword: (password: string) => Promise<void>;
  onClose: () => void;
  onEnrolled: () => void;
};

/**
 * Modal that verifies the user's password, then enrolls biometric login
 * via WebAuthn PRF. Shown when the user clicks "Enable biometric unlock"
 * on the unlock page.
 */
export default function BiometricEnrollmentModal({
  isOpen,
  password,
  onSubmitPassword,
  onClose,
  onEnrolled,
}: BiometricEnrollmentModalProps) {
  const { enroll } = useBiometricAuth();
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEnroll = useCallback(async () => {
    setIsEnrolling(true);
    setError(null);

    try {
      // First verify the password is correct by submitting it
      await onSubmitPassword(password);
    } catch {
      setError('Incorrect password. Please close this and enter the correct password.');
      setIsEnrolling(false);
      return;
    }

    try {
      // Password verified - now enroll biometrics
      const success = await enroll(password);
      if (success) {
        onEnrolled();
      } else {
        setError(
          'Biometric enrollment failed. Your browser may not support the WebAuthn PRF extension.',
        );
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unexpected error during enrollment',
      );
    } finally {
      setIsEnrolling(false);
    }
  }, [enroll, password, onSubmitPassword, onEnrolled]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onClose}>Enable biometric unlock</ModalHeader>
        <ModalBody>
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            alignItems={AlignItems.center}
            gap={4}
            paddingTop={2}
            paddingBottom={2}
          >
            <Icon
              name={IconName.SecurityKey}
              size={IconSize.Xl}
              color={IconColor.primaryDefault}
            />
            <Text
              variant={TextVariant.bodyMd}
              textAlign={TextAlign.Center}
              color={TextColor.textDefault}
            >
              Use Touch ID, Windows Hello, or your device biometrics to unlock
              MetaMask without typing your password.
            </Text>
            <Text
              variant={TextVariant.bodySm}
              textAlign={TextAlign.Center}
              color={TextColor.textAlternative}
            >
              Your password will be verified, then encrypted and stored locally
              on this device. You can disable this anytime in Settings.
            </Text>
            {error && (
              <Text
                variant={TextVariant.bodySm}
                color={TextColor.errorDefault}
                textAlign={TextAlign.Center}
              >
                {error}
              </Text>
            )}
          </Box>
        </ModalBody>
        <ModalFooter>
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            gap={2}
          >
            <Button
              variant={ButtonVariant.Primary}
              size={ButtonSize.Lg}
              block
              onClick={handleEnroll}
              disabled={isEnrolling}
              data-testid="biometric-enroll-confirm"
            >
              {isEnrolling ? 'Setting up...' : 'Enable biometric unlock'}
            </Button>
            <Button
              variant={ButtonVariant.Link}
              size={ButtonSize.Lg}
              block
              onClick={onClose}
              disabled={isEnrolling}
              data-testid="biometric-enroll-skip"
            >
              Not now
            </Button>
          </Box>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
