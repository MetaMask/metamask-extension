import React, { useCallback, useEffect, useState } from 'react';
import log from 'loglevel';
import { type PasskeyAuthenticationResponse } from '@metamask/passkey-controller';
import {
  Box,
  Text,
  TextButton,
  TextVariant,
  TextColor,
  BoxFlexDirection,
  BoxAlignItems,
  FontWeight,
} from '@metamask/design-system-react';
import { createSentryError } from '../../../../shared/lib/error';
import { captureException } from '../../../../shared/lib/sentry';
import {
  getPasskeyAuthMethodKey,
  startPasskeyAuthentication,
  cancelPasskeyCeremony,
  isPasskeyCeremonySilentError,
  translatePasskeyError,
  type TranslateFn,
} from '../../../../shared/lib/passkey';
import { getEnvironmentType } from '../../../../shared/lib/environment-type';
import { ENVIRONMENT_TYPE_SIDEPANEL } from '../../../../shared/constants/app';
import { generatePasskeyAuthenticationOptions } from '../../../store/actions';
import { useI18nContext } from '../../../hooks/useI18nContext';
import Spinner from '../../ui/spinner';
import { toast, ToastContent } from '../../ui/toast/toast';
import PasskeyTroubleshootModal from '../passkey-troubleshoot-modal';

function getPasskeyVerificationSentryContext(flow: string): string {
  return `Passkey verification in ${flow}`;
}

export type RunPasskeyVerificationCeremonyOptions = {
  sentryContext: string;
  passkeyMethodLabel: string;
  t: ReturnType<typeof useI18nContext>;
  showErrorToast?: boolean;
  toastDurationMs?: number;
};

/**
 * Runs the passkey authentication ceremony (options + WebAuthn).
 *
 * @param options - Ceremony configuration.
 * @param options.sentryContext
 * @param options.passkeyMethodLabel
 * @param options.t
 * @param options.showErrorToast
 * @param options.toastDurationMs
 * @returns The authentication response, or null when cancelled or failed.
 */
export async function runPasskeyVerificationCeremony({
  sentryContext,
  passkeyMethodLabel,
  t,
  showErrorToast = true,
  toastDurationMs,
}: RunPasskeyVerificationCeremonyOptions): Promise<PasskeyAuthenticationResponse | null> {
  try {
    const authOptions = await generatePasskeyAuthenticationOptions();
    return await startPasskeyAuthentication(authOptions);
  } catch (error: unknown) {
    if (isPasskeyCeremonySilentError(error)) {
      log.debug(`${sentryContext} cancelled or timed out`, error);
    } else {
      captureException(createSentryError(`${sentryContext} failed`, error));
      if (showErrorToast) {
        toast.error(
          <ToastContent
            title={
              translatePasskeyError(
                error,
                t as TranslateFn,
                passkeyMethodLabel,
              ) ?? t('passkeyErrorVerificationFailed', [passkeyMethodLabel])
            }
          />,
          toastDurationMs === undefined
            ? undefined
            : { duration: toastDurationMs },
        );
      }
    }
    return null;
  }
}

export type PasskeyVerificationProps = Readonly<{
  flow: string;
  autoRunOnMount?: boolean;
  deferToBrowserTab?: boolean;
  troubleshootLocation: string;
  onOpenFullScreen: () => void;
  onVerified: (response: PasskeyAuthenticationResponse) => void | Promise<void>;
  onUsePassword: () => void;
  onCeremonyFailed?: () => void;
  showErrorToast?: boolean;
  toastDurationMs?: number;
}>;

export function PasskeyVerification({
  flow,
  autoRunOnMount = true,
  deferToBrowserTab = false,
  troubleshootLocation,
  onOpenFullScreen,
  onVerified,
  onUsePassword,
  onCeremonyFailed,
  showErrorToast = true,
  toastDurationMs,
}: PasskeyVerificationProps) {
  const t = useI18nContext();
  const passkeyMethodLabel = t(getPasskeyAuthMethodKey());
  const isSidePanel = getEnvironmentType() === ENVIRONMENT_TYPE_SIDEPANEL;
  const [isVerifying, setIsVerifying] = useState(false);
  const [showTroubleshootModal, setShowTroubleshootModal] = useState(false);
  const sentryContext = getPasskeyVerificationSentryContext(flow);

  const verify = useCallback(async () => {
    setIsVerifying(true);
    try {
      return await runPasskeyVerificationCeremony({
        sentryContext,
        passkeyMethodLabel,
        t,
        showErrorToast,
        toastDurationMs,
      });
    } finally {
      setIsVerifying(false);
    }
  }, [sentryContext, passkeyMethodLabel, t, showErrorToast, toastDurationMs]);

  useEffect(() => {
    if (!autoRunOnMount || deferToBrowserTab) {
      return undefined;
    }

    let aborted = false;

    (async () => {
      const response = await verify();
      if (aborted) {
        return;
      }
      if (response) {
        await onVerified(response);
      } else {
        onCeremonyFailed?.();
      }
    })();

    return () => {
      aborted = true;
      cancelPasskeyCeremony();
      setIsVerifying(false);
    };
  }, [autoRunOnMount, deferToBrowserTab, verify, onVerified, onCeremonyFailed]);

  useEffect(
    () => () => {
      cancelPasskeyCeremony();
    },
    [],
  );

  const handleUsePassword = useCallback(() => {
    cancelPasskeyCeremony();
    setIsVerifying(false);
    onUsePassword();
  }, [onUsePassword]);

  return (
    <>
      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Center}
        marginTop={12}
        gap={4}
        data-testid={`${flow}-passkey-verifying`}
      >
        <Spinner className="w-6 h-6" />
        <Text
          variant={TextVariant.BodyLg}
          fontWeight={FontWeight.Medium}
          className="text-center"
        >
          {t('passkeyVerifyingTitle', [passkeyMethodLabel])}
        </Text>
        <Text
          variant={TextVariant.BodySm}
          color={TextColor.TextAlternative}
          className="text-center"
        >
          {t('passkeyVerifyingDescription', [passkeyMethodLabel])}
        </Text>
        {isSidePanel && isVerifying && !deferToBrowserTab ? (
          <TextButton
            type="button"
            data-testid={`${flow}-passkey-verifying-open-full-screen`}
            color={TextColor.PrimaryDefault}
            className="text-center"
            onClick={() => setShowTroubleshootModal(true)}
          >
            {t('passkeyTroubleshootVerify')}
          </TextButton>
        ) : null}
        <TextButton
          type="button"
          data-testid={`${flow}-verify-passkey-use-password`}
          color={TextColor.PrimaryDefault}
          className="text-center mt-4"
          onClick={handleUsePassword}
        >
          {t('usePassword')}
        </TextButton>
      </Box>
      {showTroubleshootModal ? (
        <PasskeyTroubleshootModal
          mode="verify"
          location={troubleshootLocation}
          onClose={() => setShowTroubleshootModal(false)}
          onOpenFullScreen={onOpenFullScreen}
        />
      ) : null}
    </>
  );
}
