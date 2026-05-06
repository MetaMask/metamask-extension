import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { PasskeyAuthenticationResponse } from '@metamask/passkey-controller';
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
import {
  startPasskeyAuthentication,
  cancelPasskeyCeremony,
  isPasskeyCeremonySilentError,
  translatePasskeyError,
} from '../../../../shared/lib/passkey';
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

export type UnlockPasskeySectionProps = {
  logoSection: ReactNode;
  isPasskeyActive: boolean;
  passkeyAutoUnlockSuppressed: boolean;
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
  isPasswordInProgress,
  onUnlockWithPasskey,
  onUsePassword,
}: UnlockPasskeySectionProps) => {
  const t = useI18nContext() as (key: string, ...args: unknown[]) => string;
  const { trackEvent } = useContext(MetaMetricsContext);

  const [passkeyError, setPasskeyError] = useState<string | null>(null);
  const [passkeyInProgress, setPasskeyInProgress] = useState(false);

  const [mountAutoUnlockEligible] = useState(
    () => isPasskeyActive && !passkeyAutoUnlockSuppressed,
  );

  const isMountedRef = useRef(true);
  const mountAutoUnlockStartedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      cancelPasskeyCeremony();
    };
  }, []);

  const runPasskeyUnlock = useCallback(async () => {
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

    try {
      const authOptions = await generatePasskeyAuthenticationOptions();
      const authenticationResponse =
        await startPasskeyAuthentication(authOptions);

      await onUnlockWithPasskey(authenticationResponse);

      trackEvent?.({
        category: MetaMetricsEventCategory.Navigation,
        event: MetaMetricsEventName.AppUnlocked,
        properties: { method: 'passkey' },
      });
    } catch (err) {
      if (!isMountedRef.current) {
        return;
      }
      if (isPasskeyCeremonySilentError(err)) {
        setPasskeyError(null);
      } else {
        setPasskeyError(
          translatePasskeyError(err, t) ?? t('passkeyUnlockFailed'),
        );
      }
    } finally {
      if (isMountedRef.current) {
        setPasskeyInProgress(false);
      }
    }
  }, [
    isPasswordInProgress,
    passkeyInProgress,
    isPasskeyActive,
    onUnlockWithPasskey,
    t,
    trackEvent,
  ]);

  useEffect(() => {
    if (mountAutoUnlockEligible && !mountAutoUnlockStartedRef.current) {
      mountAutoUnlockStartedRef.current = true;
      runPasskeyUnlock();
    }
  }, [mountAutoUnlockEligible, runPasskeyUnlock]);

  const handleUsePassword = useCallback(() => {
    cancelPasskeyCeremony();
    onUsePassword();
  }, [onUsePassword]);

  const openUnlockInFullScreen = useCallback(() => {
    cancelPasskeyCeremony();
    globalThis.platform.openExtensionInBrowser(UNLOCK_ROUTE, 'from=sidepanel');
  }, []);

  const showTroubleshoot =
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
          onClick={runPasskeyUnlock}
          aria-busy={passkeyInProgress}
        >
          {t('unlockWithPasskey')}
        </Button>
        {showTroubleshoot ? (
          <TextButton
            type="button"
            data-testid="unlock-passkey-troubleshoot-button"
            color={TextColor.PrimaryDefault}
            className="w-full text-center"
            onClick={openUnlockInFullScreen}
          >
            {t('passkeyTroubleshoot')}
          </TextButton>
        ) : null}
      </Box>

      <TextButton
        type="button"
        data-testid="unlock-use-password-button"
        color={TextColor.PrimaryDefault}
        className="w-full text-center"
        onClick={handleUsePassword}
      >
        {t('usePassword')}
      </TextButton>
    </Box>
  );
};
