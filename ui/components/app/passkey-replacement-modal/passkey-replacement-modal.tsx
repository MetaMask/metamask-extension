import React, { useCallback } from 'react';
import {
  Box,
  BoxFlexDirection,
  Modal,
  ModalContent,
  ModalOverlay,
} from '@metamask/design-system-react';
import SetupPasskeyContent, {
  type PasskeySetupOperation,
} from '../setup-passkey-content';
import { usePasskeyReplacement } from '../../../hooks/passkey/usePasskeyReplacement';

export type PasskeyReplacementModalProps = Readonly<{
  onComplete: () => void | Promise<void>;
  onRemindMeLater: () => void | Promise<void>;
}>;

/**
 * Runs the PRF-backed passkey replacement flow using the shared passkey setup
 * content.
 *
 * @param options0 - Component props.
 * @param options0.onComplete - Called after the replacement completes.
 * @param options0.onRemindMeLater - Called when the user skips replacement.
 */
export default function PasskeyReplacementModal({
  onComplete,
  onRemindMeLater,
}: PasskeyReplacementModalProps) {
  const { replacePasskey } = usePasskeyReplacement();

  const handleRemindMeLater = useCallback(() => {
    Promise.resolve(onRemindMeLater()).catch(() => undefined);
  }, [onRemindMeLater]);

  const replacePasskeyForSetup: PasskeySetupOperation = useCallback(
    async ({ onStageChange }) => {
      await replacePasskey({
        onStageChange: (stage) => {
          if (stage === 'complete') {
            return;
          }

          onStageChange?.(stage);
        },
      });
    },
    [replacePasskey],
  );

  return (
    <Modal
      isOpen
      onClose={handleRemindMeLater}
      isClosedOnOutsideClick={false}
      isClosedOnEscapeKey={false}
      data-testid="passkey-replacement-modal"
    >
      <ModalOverlay />
      <ModalContent
        className="items-center"
        modalDialogProps={{
          flexDirection: BoxFlexDirection.Column,
        }}
      >
        <Box padding={4} className="w-full">
          <SetupPasskeyContent
            onNext={onComplete}
            onSkip={handleRemindMeLater}
            enrollWithPasskey={replacePasskeyForSetup}
            isPasskeyRegistered={false}
            checkPasskeyPRFSupport={false}
          />
        </Box>
      </ModalContent>
    </Modal>
  );
}
