import React, { useCallback, useState } from 'react';
import {
  Button,
  ButtonSize,
  ButtonVariant,
} from '@metamask/design-system-react';
import {
  createDevPasskey,
  PASSKEY_RP_ID,
  verifyDevPasskey,
} from '../../../../shared/lib/passkey/passkeyDevTest';
import { getIsPasskeyDevTestEnabled } from '../../../../shared/lib/environment';
import { ThemeType } from '../../../../shared/constants/preferences';
import { useTheme } from '../../../hooks/useTheme';

const formatPasskeyError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
};

const getExtensionOriginHint = (): string => {
  if (typeof window === 'undefined') {
    return '';
  }

  return `\n\nExtension origin: ${window.location.origin}\nAdd this origin to https://${PASSKEY_RP_ID}/.well-known/webauthn for Related Origin Requests.`;
};

export default function PasskeyDevButtons() {
  const theme = useTheme();
  const [isCreating, setIsCreating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const onPressCreatePasskey = useCallback(async () => {
    setIsCreating(true);
    try {
      const result = await createDevPasskey();
      // Dev-only feedback; mirrors mobile Alert.alert for local experiments.
      // eslint-disable-next-line no-alert
      window.alert(
        `Passkey created for rpId "${PASSKEY_RP_ID}".\n\nCredential ID: ${result.id}${getExtensionOriginHint()}`,
      );
    } catch (error) {
      // eslint-disable-next-line no-alert
      window.alert(
        `Create Passkey failed: ${formatPasskeyError(error)}${getExtensionOriginHint()}`,
      );
    } finally {
      setIsCreating(false);
    }
  }, []);

  const onPressVerifyPasskey = useCallback(async () => {
    setIsVerifying(true);
    try {
      const result = await verifyDevPasskey();
      // eslint-disable-next-line no-alert
      window.alert(
        `Passkey verified for rpId "${PASSKEY_RP_ID}".\n\nCredential ID: ${result.id}${getExtensionOriginHint()}`,
      );
    } catch (error) {
      // eslint-disable-next-line no-alert
      window.alert(
        `Verify Passkey failed: ${formatPasskeyError(error)}${getExtensionOriginHint()}`,
      );
    } finally {
      setIsVerifying(false);
    }
  }, []);

  if (!getIsPasskeyDevTestEnabled()) {
    return null;
  }

  return (
    <>
      <Button
        variant={ButtonVariant.Primary}
        onClick={onPressCreatePasskey}
        data-testid="onboarding-create-passkey-dev"
        className="w-full"
        size={ButtonSize.Lg}
        disabled={isCreating || isVerifying}
        loading={isCreating}
      >
        Create Passkey
      </Button>
      <Button
        data-theme={
          theme === ThemeType.dark ? ThemeType.light : ThemeType.dark
        }
        variant={ButtonVariant.Primary}
        onClick={onPressVerifyPasskey}
        data-testid="onboarding-verify-passkey-dev"
        className="w-full"
        size={ButtonSize.Lg}
        disabled={isCreating || isVerifying}
        loading={isVerifying}
      >
        Verify Passkey
      </Button>
    </>
  );
}
