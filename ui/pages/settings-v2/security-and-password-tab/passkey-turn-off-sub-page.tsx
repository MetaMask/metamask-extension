import React, { useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Text,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  ButtonSize,
  ButtonVariant,
  Button,
  TextVariant,
  TextColor,
} from '@metamask/design-system-react';
import {
  FormTextField,
  FormTextFieldSize,
  TextFieldType,
} from '../../../components/component-library';
import { SECURITY_AND_PASSWORD_ROUTE } from '../../../helpers/constants/routes';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { cancelPasskeyCeremony } from '../../../../shared/lib/passkey';
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

const PasskeyTurnOffSteps = {
  VerifyPassword: 1,
  ConfirmTurnOff: 2,
} as const;

export default function PasskeyTurnOffSubPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const t = useI18nContext();
  const { trackEvent } = useContext(MetaMetricsContext);
  const isPasskeyRegistered = useSelector(getIsPasskeyRegistered);

  const [step, setStep] = useState<
    (typeof PasskeyTurnOffSteps)[keyof typeof PasskeyTurnOffSteps]
  >(PasskeyTurnOffSteps.VerifyPassword);
  const [walletPassword, setWalletPassword] = useState('');
  const [isIncorrectPasswordError, setIsIncorrectPasswordError] =
    useState(false);
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);
  const [isRemovingPasskey, setIsRemovingPasskey] = useState(false);

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

  const handleSubmitCurrentPassword = async () => {
    setIsVerifyingPassword(true);
    setIsIncorrectPasswordError(false);
    try {
      await verifyPassword(walletPassword);
      setStep(PasskeyTurnOffSteps.ConfirmTurnOff);
    } catch {
      setIsIncorrectPasswordError(true);
    } finally {
      setIsVerifyingPassword(false);
    }
  };

  const handleTurnOffBiometricUnlock = async () => {
    setIsRemovingPasskey(true);
    try {
      await removePasskeyWithPasswordVerification(walletPassword);
      setWalletPassword('');
      await forceUpdateMetamaskState(dispatch);
      toast.success(<ToastContent title={t('passkeyTurnedOff')} />, {
        duration: PASSKEY_SETTINGS_TOAST_DURATION_MS,
      });
      trackEvent({
        category: MetaMetricsEventCategory.Settings,
        event: MetaMetricsEventName.SettingsUpdated,
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention -- MetaMetrics snake_case contract
          passkey_registered: false,
        },
      });
      goToSettings();
    } catch {
      toast.error(<ToastContent title={t('turnOffPasskeyFailed')} />, {
        duration: PASSKEY_SETTINGS_TOAST_DURATION_MS,
      });
      goToSettings();
    } finally {
      setIsRemovingPasskey(false);
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
      {step === PasskeyTurnOffSteps.VerifyPassword && (
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
              handleSubmitCurrentPassword();
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
                isIncorrectPasswordError
                  ? t('unlockPageIncorrectPassword')
                  : null
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
                !walletPassword ||
                isVerifyingPassword ||
                isIncorrectPasswordError
              }
              isLoading={isVerifyingPassword}
            >
              {t('continue')}
            </Button>
          </form>
        </Box>
      )}

      {step === PasskeyTurnOffSteps.ConfirmTurnOff && (
        <>
          <Text
            variant={TextVariant.BodyMd}
            color={TextColor.TextAlternative}
            data-testid="turn-off-passkey-description"
          >
            {t('turnOffPasskeyDescription')}
          </Text>

          <Button
            variant={ButtonVariant.Primary}
            size={ButtonSize.Lg}
            className="w-full shrink-0"
            data-testid="turn-off-passkey-confirm-button"
            disabled={isRemovingPasskey}
            isLoading={isRemovingPasskey}
            aria-label={t('turnOffPasskey')}
            onClick={() => {
              handleTurnOffBiometricUnlock();
            }}
          >
            {t('turnOffPasskey')}
          </Button>
        </>
      )}
    </Box>
  );
}
