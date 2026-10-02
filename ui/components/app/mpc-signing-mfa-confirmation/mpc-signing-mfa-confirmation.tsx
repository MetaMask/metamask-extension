import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  BoxBackgroundColor,
  BoxFlexDirection,
  Button,
  ButtonSize,
  ButtonVariant,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import { submitRequestToBackground } from '../../../store/background-connection';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { selectPendingMpcSigningMfaRequestId } from '../../../selectors/mpc-signing-mfa';

const MpcSigningMfaConfirmationScreen = () => {
  const t = useI18nContext();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const respond = useCallback(async (accepted: boolean) => {
    setIsSubmitting(true);
    try {
      await submitRequestToBackground('messengerCall', [
        accepted
          ? 'MpcSigningMfaController:acceptSigningConfirmation'
          : 'MpcSigningMfaController:rejectSigningConfirmation',
        [],
      ]);
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return (
    <Box
      className="mpc-signing-mfa-confirmation"
      backgroundColor={BoxBackgroundColor.BackgroundDefault}
      flexDirection={BoxFlexDirection.Column}
      padding={4}
      data-testid="mpc-signing-mfa-confirmation"
    >
      <Text variant={TextVariant.HeadingMd}>{t('mpcSigningMfaTitle')}</Text>
      <Text variant={TextVariant.BodyMd}>{t('mpcSigningMfaDescription')}</Text>
      <Button
        variant={ButtonVariant.Primary}
        size={ButtonSize.Lg}
        disabled={isSubmitting}
        onClick={() => {
          respond(true).catch(() => undefined);
        }}
        data-testid="mpc-signing-mfa-confirm"
      >
        {t('mpcSigningMfaConfirm')}
      </Button>
      <Button
        variant={ButtonVariant.Secondary}
        size={ButtonSize.Lg}
        disabled={isSubmitting}
        onClick={() => {
          respond(false).catch(() => undefined);
        }}
        data-testid="mpc-signing-mfa-cancel"
      >
        {t('mpcSigningMfaCancel')}
      </Button>
    </Box>
  );
};

/**
 * Full-screen confirmation shown while the MPC keyring waits for a signing
 * 2FA token. Mounted at the app root so it covers an in-progress signature
 * confirmation.
 *
 * @returns The confirmation, or nothing when no signing request is waiting.
 */
export const MpcSigningMfaConfirmation = () => {
  const requestId = useSelector(selectPendingMpcSigningMfaRequestId);
  if (!requestId) {
    return null;
  }
  return <MpcSigningMfaConfirmationScreen key={requestId} />;
};
