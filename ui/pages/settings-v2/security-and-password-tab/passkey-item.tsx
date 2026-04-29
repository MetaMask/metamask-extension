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
  startPasskeyAuthentication,
  cancelPasskeyCeremony,
  isPasskeyCeremonySilentError,
  translatePasskeyError,
} from '../../../../shared/lib/passkey';
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
} from '../../../selectors';
import {
  forceUpdateMetamaskState,
  generatePasskeyAuthenticationOptions,
  removePasskeyWithPasskeyVerification,
} from '../../../store/actions';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { SettingsToggleItem } from '../shared/settings-toggle-item';
import { SECURITY_ITEMS } from '../search-config';

const passkeySettingsToastDurationMs = 5 * SECOND;

const PasskeyItem = () => {
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

  const registerPasskey = useCallback(() => {
    cancelPasskeyCeremony();
    if (getEnvironmentType() === ENVIRONMENT_TYPE_SIDEPANEL) {
      global.platform?.openExtensionInBrowser?.(
        SECURITY_REGISTER_PASSKEY_ROUTE,
      );
      return;
    }

    navigate(SECURITY_REGISTER_PASSKEY_ROUTE, { replace: true });
  }, [navigate]);

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

      toast.success(<ToastContent title={t('passkeyTurnedOff')} />, {
        duration: passkeySettingsToastDurationMs,
      });

      trackEvent({
        category: MetaMetricsEventCategory.Settings,
        event: MetaMetricsEventName.SettingsUpdated,
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention -- MetaMetrics snake_case contract
          passkey_registered: false,
        },
      });

      navigate(SECURITY_AND_PASSWORD_ROUTE, { replace: true });
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
      }
      navigate(SECURITY_TURN_OFF_PASSKEY_ROUTE, { replace: true });
    } finally {
      setIsPasskeyOperationPending(false);
    }
  }, [dispatch, isPasskeyRegistered, navigate, t, trackEvent]);

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
        <span>{t('passkeyDescription')}</span>
        {isPasskeyOperationPending &&
        getEnvironmentType() === ENVIRONMENT_TYPE_SIDEPANEL ? (
          <TextButton
            type="button"
            data-testid="security-passkey-sidepanel-continue-full-screen"
            color={TextColor.PrimaryDefault}
            className="mt-2 flex w-full justify-start text-left"
            onClick={openSecurityAndPasswordInFullScreen}
          >
            {t('passkeyTroubleshoot')}
          </TextButton>
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
      onToggle={handlePasskeyToggle}
      dataTestId="security-passkey-settings-toggle"
      containerDataTestId="security-passkey-settings-row"
      disabled={isPasskeyOperationPending}
    />
  );
};

export default PasskeyItem;
