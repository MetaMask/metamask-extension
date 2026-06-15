import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useSelector } from 'react-redux';
import { type PasskeyAuthenticationResponse } from '@metamask/passkey-controller';
import {
  Box,
  Text,
  TextButton,
  BoxFlexDirection,
  BoxAlignItems,
  TextVariant,
  TextColor,
  TextAlign,
  Button,
  ButtonVariant,
  ButtonSize,
} from '@metamask/design-system-react';
import { createSentryError } from '../../../../shared/lib/error';
import {
  getPasskeyAuthMethodKey,
  startPasskeyAuthentication,
  cancelPasskeyCeremony,
  isPasskeyCeremonySilentError,
  translatePasskeyError,
  getPasskeyErrorCode,
} from '../../../../shared/lib/passkey';
import { captureException } from '../../../../shared/lib/sentry';
import { getEnvironmentType } from '../../../../shared/lib/environment-type';
import { ENVIRONMENT_TYPE_SIDEPANEL } from '../../../../shared/constants/app';
import { generatePasskeyAuthenticationOptions } from '../../../store/actions';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { UNLOCK_ROUTE } from '../../../helpers/constants/routes';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { getPasskeyDerivationMethod } from '../../../selectors';
import PasskeyTroubleshootModal from '../../../components/app/passkey-troubleshoot-modal';

export type UnlockPasskeySectionProps = {
  logoSection: ReactNode;
  isPasskeyActive: boolean;
  passkeyAutoUnlockSuppressed: boolean;
  mustDeferPasskeyToBrowserTab: boolean;
  isPasswordInProgress: boolean;
  onUnlockWithPasskey: (
    authenticationResponse: PasskeyAuthenticationResponse,
  ) => Promise<void>;
  onUsePassword: () => void;
};

export const UnlockPasskeySection = ({
  logoSection,
  isPasskeyActive,
  passkeyAutoUnlockSuppressed,
  mustDeferPasskeyToBrowserTab,
  isPasswordInProgress,
  onUnlockWithPasskey,
  onUsePassword,
}: UnlockPasskeySectionProps) => {
  const t = useI18nContext() as (key: string, ...args: unknown[]) => string;
  const passkeyMethodLabel = t(getPasskeyAuthMethodKey());
  const { trackEvent } = useContext(MetaMetricsContext);
  const passkeyDerivationMethod = useSelector(getPasskeyDerivationMethod);

  const [passkeyError, setPasskeyError] = useState<string | null>(null);
  const [passkeyInProgress, setPasskeyInProgress] = useState(false);
  const [showTroubleshootModal, setShowTroubleshootModal] = useState(false);

  const [mountAutoUnlockEligible] = useState(
    () =>
      isPasskeyActive &&
      !passkeyAutoUnlockSuppressed &&
      !mustDeferPasskeyToBrowserTab,
  );

  const isMountedRef = useRef(true);
  const mountAutoUnlockStartedRef = useRef(false);
  const passkeyFailedAttemptCount = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      cancelPasskeyCeremony();
    };
  }, []);

  const runPasskeyUnlock = useCallback(
    async ({ isAutoPrompt = false }: { isAutoPrompt?: boolean } = {}) => {
      if (isPasswordInProgress || passkeyInProgress) {
        return;
      }
      if (!isPasskeyActive) {
        return;
      }

      if (isMountedRef.current) {
        setPasskeyError(null);
        setPasskeyInProgress(true);
      }

      const startedAt = Date.now();
      const baseProperties = {
        /* eslint-disable @typescript-eslint/naming-convention -- MetaMetrics snake_case contract */
        is_auto_prompt: isAutoPrompt,
        derivation_method: passkeyDerivationMethod,
        /* eslint-enable @typescript-eslint/naming-convention */
      };
      try {
        trackEvent({
          category: MetaMetricsEventCategory.Navigation,
          event: MetaMetricsEventName.PasskeyUnlockInteracted,
          properties: {
            ...baseProperties,
            status: 'started',
          },
        });

        const authOptions = await generatePasskeyAuthenticationOptions();
        const authenticationResponse =
          await startPasskeyAuthentication(authOptions);

        await onUnlockWithPasskey(authenticationResponse);

        trackEvent({
          category: MetaMetricsEventCategory.Navigation,
          event: MetaMetricsEventName.AppUnlocked,
          properties: {
            ...baseProperties,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            failed_attempts: passkeyFailedAttemptCount.current,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            unlock_type: 'passkey',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            passkey_enabled: isPasskeyActive,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            duration_ms: Date.now() - startedAt,
          },
        });
        passkeyFailedAttemptCount.current = 0;
      } catch (err) {
        if (!isMountedRef.current) {
          return;
        }

        const errorCode = getPasskeyErrorCode(err);
        const durationMs = Date.now() - startedAt;

        if (isPasskeyCeremonySilentError(err)) {
          trackEvent({
            category: MetaMetricsEventCategory.Navigation,
            event: MetaMetricsEventName.PasskeyUnlockInteracted,
            properties: {
              ...baseProperties,
              status: 'cancelled',
              // eslint-disable-next-line @typescript-eslint/naming-convention
              duration_ms: durationMs,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              reason: errorCode,
            },
          });
          setPasskeyError(null);
        } else {
          passkeyFailedAttemptCount.current += 1;
          captureException(createSentryError('Passkey unlock failed', err), {
            extra: {
              ...baseProperties,
              failedAttempts: passkeyFailedAttemptCount.current,
              durationMs,
              errorCode,
            },
          });
          trackEvent({
            category: MetaMetricsEventCategory.Navigation,
            event: MetaMetricsEventName.AppUnlockedFailed,
            properties: {
              ...baseProperties,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              failed_attempts: passkeyFailedAttemptCount.current,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              unlock_type: 'passkey',
              reason: errorCode,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              passkey_enabled: isPasskeyActive,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              duration_ms: durationMs,
            },
          });
          setPasskeyError(
            translatePasskeyError(err, t, passkeyMethodLabel) ??
              t('passkeyUnlockFailed', [passkeyMethodLabel]),
          );
        }
      } finally {
        if (isMountedRef.current) {
          setPasskeyInProgress(false);
        }
      }
    },
    [
      isPasswordInProgress,
      passkeyInProgress,
      isPasskeyActive,
      onUnlockWithPasskey,
      passkeyMethodLabel,
      passkeyDerivationMethod,
      t,
      trackEvent,
    ],
  );

  useEffect(() => {
    if (mountAutoUnlockEligible && !mountAutoUnlockStartedRef.current) {
      mountAutoUnlockStartedRef.current = true;
      runPasskeyUnlock({ isAutoPrompt: true });
    }
  }, [mountAutoUnlockEligible, runPasskeyUnlock]);

  const handleUsePassword = useCallback(() => {
    trackEvent({
      category: MetaMetricsEventCategory.Navigation,
      event: MetaMetricsEventName.PasskeyUnlockInteracted,
      properties: {
        status: 'use_password_selected',
        /* eslint-disable @typescript-eslint/naming-convention -- MetaMetrics snake_case contract */
        derivation_method: passkeyDerivationMethod,
        /* eslint-enable @typescript-eslint/naming-convention */
      },
    });
    cancelPasskeyCeremony();
    onUsePassword();
  }, [onUsePassword, trackEvent, passkeyDerivationMethod]);

  const openUnlockInFullScreen = useCallback(() => {
    cancelPasskeyCeremony();
    globalThis.platform?.openExtensionInBrowser?.(UNLOCK_ROUTE);
  }, []);

  const handlePasskeyUnlockAction = useCallback(() => {
    if (mustDeferPasskeyToBrowserTab) {
      openUnlockInFullScreen();
      return;
    }
    runPasskeyUnlock();
  }, [mustDeferPasskeyToBrowserTab, openUnlockInFullScreen, runPasskeyUnlock]);

  const showTroubleshoot =
    !mustDeferPasskeyToBrowserTab &&
    getEnvironmentType() === ENVIRONMENT_TYPE_SIDEPANEL &&
    isPasskeyActive &&
    passkeyInProgress;

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      className="unlock-page w-full"
      alignItems={BoxAlignItems.Center}
      gap={4}
      padding={4}
    >
      {logoSection}
      {passkeyError ? (
        <Text
          variant={TextVariant.BodySm}
          color={TextColor.ErrorDefault}
          textAlign={TextAlign.Center}
          data-testid="unlock-passkey-error-banner"
          className="w-full"
        >
          {passkeyError}
        </Text>
      ) : null}
      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Center}
        gap={2}
        className="w-full"
      >
        <Button
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          className="w-full"
          type="button"
          isLoading={passkeyInProgress}
          data-testid="unlock-passkey-button"
          disabled={isPasswordInProgress || passkeyInProgress}
          onClick={handlePasskeyUnlockAction}
          aria-busy={passkeyInProgress}
        >
          {t('unlockWithPasskey', [passkeyMethodLabel])}
        </Button>
        {showTroubleshoot ? (
          <TextButton
            type="button"
            data-testid="unlock-passkey-troubleshoot-button"
            color={TextColor.PrimaryDefault}
            className="text-center"
            onClick={() => setShowTroubleshootModal(true)}
          >
            {t('passkeyTroubleshootUnlock')}
          </TextButton>
        ) : null}
      </Box>

      {showTroubleshootModal ? (
        <PasskeyTroubleshootModal
          mode="unlock"
          location="unlock"
          onClose={() => setShowTroubleshootModal(false)}
          onOpenFullScreen={openUnlockInFullScreen}
        />
      ) : null}

      <TextButton
        type="button"
        data-testid="unlock-use-password-button"
        color={TextColor.PrimaryDefault}
        className="text-center"
        onClick={handleUsePassword}
      >
        {t('usePassword')}
      </TextButton>
    </Box>
  );
};
