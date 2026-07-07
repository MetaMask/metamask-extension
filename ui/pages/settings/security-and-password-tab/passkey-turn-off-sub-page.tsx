import React, { useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  ButtonSize,
  ButtonVariant,
  Button,
} from '@metamask/design-system-react';
import {
  FormTextField,
  FormTextFieldSize,
  TextFieldType,
} from '../../../components/component-library';
import { SECURITY_AND_PASSWORD_ROUTE } from '../../../helpers/constants/routes';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { createSentryError } from '../../../../shared/lib/error';
import {
  getPasskeyAuthMethodKey,
  cancelPasskeyCeremony,
} from '../../../../shared/lib/passkey';
import { captureException } from '../../../../shared/lib/sentry';
import { getPasskeyErrorCode } from '../../../../shared/lib/passkey/passkey-error';
import {
  forceUpdateMetamaskState,
  removePasskeyWithPasswordVerification,
  verifyPassword,
} from '../../../store/actions';
import { toast, ToastContent } from '../../../components/ui/toast/toast';
import { SECOND } from '../../../../shared/constants/time';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { getIsPasskeyRegistered } from '../../../selectors';

const PASSKEY_SETTINGS_TOAST_DURATION_MS = 5 * SECOND;

export default function PasskeyTurnOffSubPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const t = useI18nContext();
  const passkeyMethodLabel = t(getPasskeyAuthMethodKey());
  const { trackEvent } = useContext(MetaMetricsContext);
  const isPasskeyRegistered = useSelector(getIsPasskeyRegistered);

  const [walletPassword, setWalletPassword] = useState('');
  const [isIncorrectPasswordError, setIsIncorrectPasswordError] =
    useState(false);
  const [isTurnOffInProgress, setIsTurnOffInProgress] = useState(false);

  useEffect(
    () => () => {
      cancelPasskeyCeremony();
    },
    [],
  );

  useEffect(() => {
    if (!isPasskeyRegistered) {
      navigate(SECURITY_AND_PASSWORD_ROUTE, { replace: true });
    }
  }, [isPasskeyRegistered, navigate]);

  const goToSettings = () => {
    setWalletPassword('');
    navigate(SECURITY_AND_PASSWORD_ROUTE, { replace: true });
  };

  const handleTurnOffPasskeyWithPasswordSubmit = async () => {
    setIsTurnOffInProgress(true);
    setIsIncorrectPasswordError(false);
    try {
      try {
        await verifyPassword(walletPassword);
      } catch {
        setIsIncorrectPasswordError(true);
        return;
      }

      const startedAt = Date.now();
      const baseProperties = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        verification_method: 'password',
      };
      trackEvent({
        category: MetaMetricsEventCategory.Settings,
        event: MetaMetricsEventName.PasskeyTurnOff,
        properties: {
          ...baseProperties,
          status: 'started',
        },
      });
      try {
        await removePasskeyWithPasswordVerification(walletPassword);
        await forceUpdateMetamaskState(dispatch);
        trackEvent({
          category: MetaMetricsEventCategory.Settings,
          event: MetaMetricsEventName.PasskeyTurnOff,
          properties: {
            ...baseProperties,
            status: 'completed',
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
            /* eslint-disable @typescript-eslint/naming-convention */
            settings_group: 'security_privacy',
            settings_type: 'passkey',
            old_value: true,
            new_value: false,
            /* eslint-enable @typescript-eslint/naming-convention */
          },
        });
        goToSettings();
      } catch (error: unknown) {
        const durationMs = Date.now() - startedAt;
        const errorCode = getPasskeyErrorCode(error);
        trackEvent({
          category: MetaMetricsEventCategory.Settings,
          event: MetaMetricsEventName.PasskeyTurnOff,
          properties: {
            ...baseProperties,
            status: 'failed',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            duration_ms: durationMs,
            reason: errorCode,
          },
        });
        captureException(
          createSentryError('Passkey turn off in settings failed', error),
          { extra: { verificationMethod: 'password', durationMs, errorCode } },
        );
        toast.error(
          <ToastContent
            title={t('turnOffPasskeyFailed', [passkeyMethodLabel])}
          />,
          {
            duration: PASSKEY_SETTINGS_TOAST_DURATION_MS,
          },
        );
        goToSettings();
      }
    } finally {
      setIsTurnOffInProgress(false);
    }
  };

  if (!isPasskeyRegistered) {
    return null;
  }

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      justifyContent={BoxJustifyContent.Start}
      alignItems={BoxAlignItems.Stretch}
      gap={6}
      padding={4}
      className="h-full min-h-0"
    >
      <Box
        flexDirection={BoxFlexDirection.Column}
        gap={6}
        justifyContent={BoxJustifyContent.Between}
        asChild
        className="min-h-0 shrink-0"
      >
        <form
          onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            handleTurnOffPasskeyWithPasswordSubmit();
          }}
        >
          <FormTextField
            id="turn-off-passkey-current-password"
            label={t('enterPasswordCurrent')}
            textFieldProps={{ type: TextFieldType.Password }}
            size={FormTextFieldSize.Lg}
            labelProps={{
              marginBottom: 1,
            }}
            inputProps={{
              autoFocus: true,
              'data-testid': 'turn-off-passkey-password-input',
            }}
            value={walletPassword}
            error={isIncorrectPasswordError}
            helpText={
              isIncorrectPasswordError ? t('unlockPageIncorrectPassword') : null
            }
            onChange={(e) => {
              setWalletPassword(e.target.value);
              setIsIncorrectPasswordError(false);
            }}
          />
          <Button
            type="submit"
            variant={ButtonVariant.Primary}
            size={ButtonSize.Lg}
            className="w-full"
            data-testid="turn-off-passkey-verify-continue-button"
            disabled={
              !walletPassword || isTurnOffInProgress || isIncorrectPasswordError
            }
            isLoading={isTurnOffInProgress}
          >
            {t('continue')}
          </Button>
        </form>
      </Box>
    </Box>
  );
}
