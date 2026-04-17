import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
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
import { getEnvironmentType } from '../../../../../shared/lib/environment-type';
import { ENVIRONMENT_TYPE_SIDEPANEL } from '../../../../../shared/constants/app';
import {
  FormTextField,
  FormTextFieldSize,
  TextFieldType,
} from '../../../../components/component-library';
import {
  SECURITY_ROUTE,
  SECURITY_TURN_OFF_PASSKEY_ROUTE,
} from '../../../../helpers/constants/routes';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { PasskeySettingsToastType } from '../../../../../shared/constants/app-state';
import { setShowPasskeySettingsToast } from '../../../../components/app/toast-master/utils';
import {
  forceUpdateMetamaskState,
  removePasskeyWithPasswordVerification,
} from '../../../../store/actions';

export default function TurnOffPasskey() {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [isIncorrectPasswordError, setIsIncorrectPasswordError] =
    useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      dispatch(setShowPasskeySettingsToast(PasskeySettingsToastType.TurnedOff));
      navigate(SECURITY_ROUTE);
    } catch {
      setIsIncorrectPasswordError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

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
