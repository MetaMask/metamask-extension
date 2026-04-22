import React, { useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import log from 'loglevel';
import {
  Box,
  Button,
  ButtonSize,
  Text,
  TextVariant,
  TextColor,
  BoxFlexDirection,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import { getEnvironmentType } from '../../../../shared/lib/environment-type';
import { ENVIRONMENT_TYPE_SIDEPANEL } from '../../../../shared/constants/app';
import {
  FormTextField,
  FormTextFieldSize,
  TextFieldType,
} from '../../../components/component-library';
import {
  SECURITY_AND_PASSWORD_ROUTE,
  SECURITY_TURN_OFF_PASSKEY_ROUTE,
} from '../../../helpers/constants/routes';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getIsPasskeyRegistered } from '../../../selectors';
import {
  forceUpdateMetamaskState,
  removePasskeyWithPasswordVerification,
  generatePasskeyAuthenticationOptions,
  removePasskeyWithPasskeyVerification,
} from '../../../store/actions';
import { toast, ToastContent } from '../../../components/ui/toast/toast';
import { SECOND } from '../../../../shared/constants/time';
import {
  startPasskeyAuthentication,
  cancelPasskeyCeremony,
} from '../../../../shared/lib/passkey';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';

const passkeySettingsToastDurationMs = 5 * SECOND;

type AutoPasskeyPhase = 'pending' | 'use-password';

export default function PasskeyTurnOffSubPage() {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { trackEvent } = useContext(MetaMetricsContext);
  const isPasskeyRegistered = useSelector(getIsPasskeyRegistered);

  const [autoPasskeyPhase, setAutoPasskeyPhase] = useState<AutoPasskeyPhase>(
    () => (isPasskeyRegistered ? 'pending' : 'use-password'),
  );
  const [password, setPassword] = useState('');
  const [isIncorrectPasswordError, setIsIncorrectPasswordError] =
    useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    return () => {
      cancelPasskeyCeremony();
    };
  }, []);

  useEffect(() => {
    if (!isPasskeyRegistered || autoPasskeyPhase !== 'pending') {
      return;
    }

    let cancelled = false;

    const attemptPasskeyTurnOff = async () => {
      try {
        const authOptions = await generatePasskeyAuthenticationOptions();
        const authenticationResponse =
          await startPasskeyAuthentication(authOptions);
        if (cancelled) {
          return;
        }
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
            passkey_unlock_registered: false,
          },
        });
        navigate(SECURITY_AND_PASSWORD_ROUTE);
      } catch (error: unknown) {
        if (cancelled) {
          return;
        }
        log.debug(
          'Passkey verification for disable failed; showing password fallback',
          error,
        );
        setAutoPasskeyPhase('use-password');
      }
    };

    attemptPasskeyTurnOff();

    return () => {
      cancelled = true;
      cancelPasskeyCeremony();
    };
  }, [
    autoPasskeyPhase,
    dispatch,
    isPasskeyRegistered,
    navigate,
    t,
    trackEvent,
  ]);

  const openTurnOffPasskeyInFullScreen = () => {
    global.platform?.openExtensionInBrowser?.(
      SECURITY_TURN_OFF_PASSKEY_ROUTE,
      'from=sidepanel',
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setIsIncorrectPasswordError(false);
    try {
      await removePasskeyWithPasswordVerification(password);
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
          passkey_unlock_registered: false,
        },
      });
      navigate(SECURITY_AND_PASSWORD_ROUTE);
    } catch {
      setIsIncorrectPasswordError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (autoPasskeyPhase === 'pending') {
    return (
      <Box padding={4} flexDirection={BoxFlexDirection.Column} gap={4}>
        <Text
          variant={TextVariant.BodyMd}
          color={TextColor.TextAlternative}
          data-testid="passkey-turn-off-pending"
        >
          {t('changePasswordVerifyingPasskey')}
        </Text>
      </Box>
    );
  }

  return (
    <Box padding={4} flexDirection={BoxFlexDirection.Column} gap={6}>
      <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
        {t('turnOffPasskeysDescription')}
      </Text>
      <Box
        flexDirection={BoxFlexDirection.Column}
        gap={6}
        justifyContent={BoxJustifyContent.Between}
        asChild
        className="h-full"
      >
        <form onSubmit={handleSubmit}>
          <FormTextField
            id="turn-off-passkey-password"
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
            value={password}
            error={isIncorrectPasswordError}
            helpText={
              isIncorrectPasswordError ? t('unlockPageIncorrectPassword') : null
            }
            onChange={(e) => {
              setPassword(e.target.value);
              setIsIncorrectPasswordError(false);
            }}
          />
          <Button
            type="submit"
            className="w-full"
            size={ButtonSize.Lg}
            disabled={!password || isSubmitting}
            data-testid="turn-off-passkey-submit"
          >
            {t('turnOffPasskeysConfirm')}
          </Button>
          {getEnvironmentType() === ENVIRONMENT_TYPE_SIDEPANEL ? (
            <button
              type="button"
              data-testid="turn-off-passkey-trouble-continue-full-screen"
              onClick={openTurnOffPasskeyInFullScreen}
              className="mt-4 w-full cursor-pointer border-0 bg-transparent p-0 text-left outline-none hover:bg-transparent hover:shadow-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-primary-default focus-visible:ring-offset-2"
            >
              <Text
                variant={TextVariant.BodySm}
                color={TextColor.PrimaryDefault}
                asChild
              >
                <span className="block w-full text-center no-underline hover:no-underline">
                  {t('passkeyTroubleContinueFullScreen')}
                </span>
              </Text>
            </button>
          ) : null}
        </form>
      </Box>
    </Box>
  );
}
