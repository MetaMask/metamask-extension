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
import { Text, TextColor, TextVariant } from '@metamask/design-system-react';
import { ENVIRONMENT_TYPE_SIDEPANEL } from '../../../../shared/constants/app';
import { getEnvironmentType } from '../../../../shared/lib/environment-type';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { SECOND } from '../../../../shared/constants/time';
import {
  startPasskeyAuthentication,
  startPasskeyRegistration,
  cancelPasskeyCeremony,
  isPasskeyCeremonySilentError,
  translatePasskeyError,
} from '../../../../shared/lib/passkey';
import { toast, ToastContent } from '../../../components/ui/toast/toast';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  SECURITY_AND_PASSWORD_ROUTE,
  SECURITY_REGISTER_PASSKEY_ROUTE,
} from '../../../helpers/constants/routes';
import {
  getIsPasskeyFeatureAvailable,
  getIsPasskeyRegistered,
} from '../../../selectors';
import {
  forceUpdateMetamaskState,
  generatePasskeyAuthenticationOptions,
  generatePasskeyRegistrationOptions,
  protectVaultKeyWithPasskey,
  removePasskeyWithPasskeyVerification,
} from '../../../store/actions';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { SettingsToggleItem } from '../shared/settings-toggle-item';
import { SECURITY_ITEMS } from '../search-config';

const passkeySettingsToastDurationMs = 5 * SECOND;

const PasskeySettingsItem = () => {
  const t = useI18nContext() as (key: string) => string;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { trackEvent } = useContext(MetaMetricsContext);

  const isPasskeyFeatureAvailable = useSelector(getIsPasskeyFeatureAvailable);
  const isPasskeyRegistered = useSelector(getIsPasskeyRegistered);

  const [isPasskeyOperationPending, setIsPasskeyOperationPending] =
    useState(false);

  useEffect(() => {
    return () => {
      cancelPasskeyCeremony();
    };
  }, []);

  const openSecurityAndPasswordInFullScreen = useCallback(() => {
    cancelPasskeyCeremony();
    global.platform?.openExtensionInBrowser?.(SECURITY_AND_PASSWORD_ROUTE);
  }, []);

  const registerPasskey = useCallback(async () => {
    if (getEnvironmentType() === ENVIRONMENT_TYPE_SIDEPANEL) {
      global.platform?.openExtensionInBrowser?.(
        SECURITY_REGISTER_PASSKEY_ROUTE,
      );
      return;
    }

    setIsPasskeyOperationPending(true);
    try {
      const options = await generatePasskeyRegistrationOptions();
      const registrationResponse = await startPasskeyRegistration(options);
      await protectVaultKeyWithPasskey(registrationResponse);
      await forceUpdateMetamaskState(dispatch);

      toast.success(
        <ToastContent title={t('passkeySettingsToastTurnedOn')} />,
        { duration: passkeySettingsToastDurationMs },
      );

      trackEvent({
        category: MetaMetricsEventCategory.Settings,
        event: MetaMetricsEventName.SettingsUpdated,
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention -- MetaMetrics snake_case contract
          passkey_registered: true,
        },
      });

      throw new Error('test');
    } catch (error) {
      if (isPasskeyCeremonySilentError(error)) {
        log.debug(
          'Passkey registration from settings cancelled or timed out',
          error,
        );
      } else {
        log.error('Passkey registration from settings failed', error);
        toast.error(
          <ToastContent
            title={
              translatePasskeyError(error, t) ??
              t('passkeyErrorRegistrationFailed')
            }
          />,
          { duration: passkeySettingsToastDurationMs },
        );
      }
    } finally {
      setIsPasskeyOperationPending(false);
    }
  }, [dispatch, t, trackEvent]);

  const removePasskey = useCallback(async () => {
    if (!isPasskeyRegistered) {
      return;
    }

    setIsPasskeyOperationPending(true);
    try {
      const authOptions = await generatePasskeyAuthenticationOptions();
      const authenticationResponse =
        await startPasskeyAuthentication(authOptions);
      await removePasskeyWithPasskeyVerification(authenticationResponse);
      await forceUpdateMetamaskState(dispatch);

      toast.success(
        <ToastContent title={t('passkeySettingsToastTurnedOff')} />,
        { duration: passkeySettingsToastDurationMs },
      );

      trackEvent({
        category: MetaMetricsEventCategory.Settings,
        event: MetaMetricsEventName.SettingsUpdated,
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention -- MetaMetrics snake_case contract
          passkey_registered: false,
        },
      });
    } catch (error: unknown) {
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
              translatePasskeyError(error, t) ??
              t('passkeyErrorVerificationFailed')
            }
          />,
          { duration: passkeySettingsToastDurationMs },
        );
        if (getEnvironmentType() === ENVIRONMENT_TYPE_SIDEPANEL) {
          global.platform?.openExtensionInBrowser?.(
            SECURITY_AND_PASSWORD_ROUTE,
          );
        } else {
          navigate(SECURITY_AND_PASSWORD_ROUTE);
        }
      }
    } finally {
      setIsPasskeyOperationPending(false);
    }
  }, [dispatch, isPasskeyRegistered, navigate, t, trackEvent]);

  const handlePasskeySettingsToggle = useCallback(
    async (isPasskeyUnlockEnabled: boolean) => {
      if (isPasskeyOperationPending) {
        return;
      }

      const shouldEnablePasskeyUnlock = !isPasskeyUnlockEnabled;
      if (shouldEnablePasskeyUnlock) {
        await registerPasskey();
        return;
      }

      await removePasskey();
    },
    [isPasskeyOperationPending, registerPasskey, removePasskey],
  );

  const description = useMemo(() => {
    const body = (
      <>
        <span>{t('biometricsToggleDescription')}</span>
        {isPasskeyOperationPending &&
        getEnvironmentType() === ENVIRONMENT_TYPE_SIDEPANEL ? (
          <button
            type="button"
            data-testid="security-passkey-sidepanel-continue-full-screen"
            className="mt-2 w-full cursor-pointer border-0 bg-transparent p-0 text-left outline-none hover:bg-transparent hover:shadow-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-primary-default focus-visible:ring-offset-2"
            onClick={openSecurityAndPasswordInFullScreen}
          >
            <Text variant={TextVariant.BodySm} color={TextColor.PrimaryDefault}>
              {t('passkeyTroubleContinueFullScreen')}
            </Text>
          </button>
        ) : null}
      </>
    );
    return body;
  }, [openSecurityAndPasswordInFullScreen, isPasskeyOperationPending, t]);

  if (!isPasskeyFeatureAvailable) {
    return null;
  }

  return (
    <SettingsToggleItem
      title={t(SECURITY_ITEMS.passkey)}
      description={description}
      value={Boolean(isPasskeyRegistered)}
      onToggle={handlePasskeySettingsToggle}
      dataTestId="security-passkey-settings-toggle"
      containerDataTestId="security-passkey-settings-row"
      disabled={isPasskeyOperationPending}
    />
  );
};

export default PasskeySettingsItem;
