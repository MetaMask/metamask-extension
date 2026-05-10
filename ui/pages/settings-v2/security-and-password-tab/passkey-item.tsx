import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import log from 'loglevel';
import { TextButton, TextColor } from '@metamask/design-system-react';
import { ENVIRONMENT_TYPE_SIDEPANEL } from '../../../../shared/constants/app';
import { getEnvironmentType } from '../../../../shared/lib/environment-type';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { SECOND } from '../../../../shared/constants/time';
import {
  getPasskeyAuthMethodKey,
  startPasskeyAuthentication,
  cancelPasskeyCeremony,
  isPasskeyCeremonySilentError,
  translatePasskeyError,
  getPasskeyErrorCode,
} from '../../../../shared/lib/passkey';
import PasskeyTroubleshootModal from '../../../components/app/passkey-troubleshoot-modal';
import { toast, ToastContent } from '../../../components/ui/toast/toast';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  SECURITY_AND_PASSWORD_ROUTE,
  SECURITY_REGISTER_PASSKEY_ROUTE,
  SECURITY_TURN_OFF_PASSKEY_ROUTE,
} from '../../../helpers/constants/routes';
import {
  getIsPasskeyFeatureAvailable,
  getIsPasskeyRegistered,
  getIsEnrolledPasskeyIncompatibleWithSidepanel,
} from '../../../selectors';
import {
  forceUpdateMetamaskState,
  generatePasskeyAuthenticationOptions,
  removePasskeyWithPasskeyVerification,
} from '../../../store/actions';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { SettingsToggleItem } from '../shared/settings-toggle-item';
import { SECURITY_ITEMS } from '../search-config';

const PASSKEY_SETTINGS_TOAST_DURATION_MS = 5 * SECOND;

const PasskeyItem = () => {
  const t = useI18nContext() as (
    key: string,
    substitutions?: string[],
  ) => string;
  const passkeyMethodLabel = t(getPasskeyAuthMethodKey());
  const passkeyMethodSpecificLabel = t(
    getPasskeyAuthMethodKey({ specific: true }),
  );
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { trackEvent } = useContext(MetaMetricsContext);

  const isPasskeyFeatureAvailable = useSelector(getIsPasskeyFeatureAvailable);
  const isPasskeyRegistered = useSelector(getIsPasskeyRegistered);
  const isEnrolledPasskeyIncompatibleWithSidepanel = useSelector(
    getIsEnrolledPasskeyIncompatibleWithSidepanel,
  );

  const [isPasskeyOperationPending, setIsPasskeyOperationPending] =
    useState(false);
  const [showPasskeyTroubleshootModal, setShowPasskeyTroubleshootModal] =
    useState(false);

  useEffect(() => {
    return () => {
      cancelPasskeyCeremony();
    };
  }, []);

  const openSecurityAndPasswordInFullScreen = useCallback(() => {
    cancelPasskeyCeremony();
    globalThis.platform?.openExtensionInBrowser?.(SECURITY_AND_PASSWORD_ROUTE);
  }, []);

  const registerPasskey = useCallback(() => {
    cancelPasskeyCeremony();
    if (getEnvironmentType() === ENVIRONMENT_TYPE_SIDEPANEL) {
      globalThis.platform?.openExtensionInBrowser?.(
        `${SECURITY_REGISTER_PASSKEY_ROUTE}?from=sidepanel`,
      );
      return;
    }

    navigate(SECURITY_REGISTER_PASSKEY_ROUTE, { replace: true });
  }, [navigate]);

  const removePasskey = useCallback(async () => {
    if (!isPasskeyRegistered) {
      return;
    }

    if (
      getEnvironmentType() === ENVIRONMENT_TYPE_SIDEPANEL &&
      isEnrolledPasskeyIncompatibleWithSidepanel
    ) {
      cancelPasskeyCeremony();
      trackEvent({
        category: MetaMetricsEventCategory.Settings,
        event: MetaMetricsEventName.PasskeyTurnOffStarted,
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          environment_type: getEnvironmentType(),
          // eslint-disable-next-line @typescript-eslint/naming-convention
          verification_method: 'passkey',
        },
      });
      globalThis.platform?.openExtensionInBrowser?.(
        SECURITY_AND_PASSWORD_ROUTE,
      );
      return;
    }

    setIsPasskeyOperationPending(true);
    const startedAt = Date.now();
    const environmentType = getEnvironmentType();
    const verificationMethod = 'passkey';
    trackEvent({
      category: MetaMetricsEventCategory.Settings,
      event: MetaMetricsEventName.PasskeyTurnOffStarted,
      properties: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        environment_type: environmentType,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        verification_method: verificationMethod,
      },
    });
    try {
      const authOptions = await generatePasskeyAuthenticationOptions();
      const authenticationResponse =
        await startPasskeyAuthentication(authOptions);
      await removePasskeyWithPasskeyVerification(authenticationResponse);
      await forceUpdateMetamaskState(dispatch);

      trackEvent({
        category: MetaMetricsEventCategory.Settings,
        event: MetaMetricsEventName.PasskeyTurnOffCompleted,
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          environment_type: environmentType,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          verification_method: verificationMethod,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          duration_ms: Date.now() - startedAt,
        },
      });

      toast.success(
        <ToastContent title={t('passkeyTurnedOff', [passkeyMethodLabel])} />,
        {
          duration: PASSKEY_SETTINGS_TOAST_DURATION_MS,
        },
      );

      trackEvent({
        category: MetaMetricsEventCategory.Settings,
        event: MetaMetricsEventName.SettingsUpdated,
        properties: {
          /* eslint-disable @typescript-eslint/naming-convention -- MetaMetrics snake_case contract */
          settings_group: 'security_privacy',
          settings_type: 'passkey',
          old_value: true,
          new_value: false,
          /* eslint-enable @typescript-eslint/naming-convention */
        },
      });

      navigate(SECURITY_AND_PASSWORD_ROUTE, { replace: true });
    } catch (error: unknown) {
      trackEvent({
        category: MetaMetricsEventCategory.Settings,
        event: MetaMetricsEventName.PasskeyTurnOffFailed,
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          environment_type: environmentType,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          verification_method: verificationMethod,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          duration_ms: Date.now() - startedAt,
          reason: getPasskeyErrorCode(error),
        },
      });
      if (isPasskeyCeremonySilentError(error)) {
        log.debug(
          'Passkey verification for disable cancelled or timed out',
          error,
        );
      } else {
        log.error(
          'Passkey verification for disable failed; offering password fallback',
          error,
        );
        toast.error(
          <ToastContent
            title={
              translatePasskeyError(error, t, passkeyMethodLabel) ??
              t('passkeyErrorVerificationFailed', [passkeyMethodLabel])
            }
          />,
          { duration: PASSKEY_SETTINGS_TOAST_DURATION_MS },
        );
      }
      navigate(SECURITY_TURN_OFF_PASSKEY_ROUTE, { replace: true });
    } finally {
      setIsPasskeyOperationPending(false);
    }
  }, [
    dispatch,
    isEnrolledPasskeyIncompatibleWithSidepanel,
    isPasskeyRegistered,
    navigate,
    passkeyMethodLabel,
    t,
    trackEvent,
  ]);

  const handlePasskeyToggle = useCallback(
    async (isPasskeyUnlockEnabled: boolean) => {
      if (isPasskeyOperationPending) {
        return;
      }

      const shouldEnablePasskeyUnlock = !isPasskeyUnlockEnabled;
      if (shouldEnablePasskeyUnlock) {
        registerPasskey();
        return;
      }

      await removePasskey();
    },
    [isPasskeyOperationPending, registerPasskey, removePasskey],
  );

  const description = useMemo(() => {
    const body = (
      <>
        <span>{t('passkeyDescription', [passkeyMethodSpecificLabel])}</span>
        {isPasskeyOperationPending &&
        getEnvironmentType() === ENVIRONMENT_TYPE_SIDEPANEL ? (
          <TextButton
            type="button"
            data-testid="security-passkey-sidepanel-continue-full-screen"
            color={TextColor.PrimaryDefault}
            className="mt-2 flex w-full justify-start text-left"
            onClick={() => setShowPasskeyTroubleshootModal(true)}
          >
            {t('passkeyTroubleshootVerify')}
          </TextButton>
        ) : null}
      </>
    );
    return body;
  }, [isPasskeyOperationPending, passkeyMethodSpecificLabel, t]);

  if (!isPasskeyFeatureAvailable) {
    return null;
  }

  return (
    <>
      <SettingsToggleItem
        title={t(SECURITY_ITEMS.passkey, [passkeyMethodLabel])}
        description={description}
        value={Boolean(isPasskeyRegistered)}
        onToggle={handlePasskeyToggle}
        dataTestId="security-passkey-settings-toggle"
        containerDataTestId="security-passkey-settings-row"
        disabled={isPasskeyOperationPending}
      />
      {showPasskeyTroubleshootModal ? (
        <PasskeyTroubleshootModal
          mode="verify"
          location="settings:passkey"
          onClose={() => setShowPasskeyTroubleshootModal(false)}
          onOpenFullScreen={openSecurityAndPasswordInFullScreen}
        />
      ) : null}
    </>
  );
};

export default PasskeyItem;
