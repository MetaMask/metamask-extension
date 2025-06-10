import EventEmitter from 'events';
import React, { useState, useContext } from 'react';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import {
  Box,
  Button,
  ButtonSize,
  FormTextField,
  FormTextFieldSize,
  Text,
  TextFieldType,
} from '../../../../components/component-library';
import {
  AlignItems,
  BlockSize,
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { isBeta, isFlask } from '../../../../helpers/utils/build-types';
import Mascot from '../../../../components/ui/mascot';
import Spinner from '../../../../components/ui/spinner';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { changePassword, verifyPassword } from '../../../../store/actions';
import PasswordForm from '../../../../components/app/password-form/password-form';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import { SECURITY_ROUTE } from '../../../../helpers/constants/routes';
import ChangePasswordWarning from './change-password-warning';

const ChangePasswordSteps = {
  VerifyCurrentPassword: 1,
  ChangePassword: 2,
  ChangePasswordLoading: 3,
};

const ChangePassword = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const history = useHistory();
  const trackEvent = useContext(MetaMetricsContext);
  const [eventEmitter] = useState(new EventEmitter());
  const [step, setStep] = useState(ChangePasswordSteps.VerifyCurrentPassword);

  const [currentPassword, setCurrentPassword] = useState('');
  const [isIncorrectPasswordError, setIsIncorrectPasswordError] =
    useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [showChangePasswordWarning, setShowChangePasswordWarning] =
    useState(false);

  const renderMascot = () => {
    if (isFlask()) {
      return (
        <img src="./images/logo/metamask-fox.svg" width="100" height="100" />
      );
    }
    if (isBeta()) {
      return (
        <img src="./images/logo/metamask-fox.svg" width="100" height="100" />
      );
    }
    return (
      <Mascot animationEventEmitter={eventEmitter} width="100" height="100" />
    );
  };

  const handleSubmitCurrentPassword = async () => {
    try {
      await verifyPassword(currentPassword);
      setIsIncorrectPasswordError(false);
      setStep(ChangePasswordSteps.ChangePassword);
    } catch (error) {
      setIsIncorrectPasswordError(true);
    }
  };

  const onChangePassword = async () => {
    try {
      setShowChangePasswordWarning(false);
      setStep(ChangePasswordSteps.ChangePasswordLoading);
      await dispatch(changePassword(newPassword, currentPassword));

      // Track password changed event
      trackEvent({
        category: MetaMetricsEventCategory.Settings,
        event: MetaMetricsEventName.PasswordChanged,
        properties: {
          biometrics_enabled: false,
        },
      });

      // upon successful password change, go back to the settings page
      history.push(SECURITY_ROUTE);
    } catch (error) {
      console.error(error);
      setStep(ChangePasswordSteps.VerifyCurrentPassword);
    }
  };

  return (
    <Box padding={4} className="change-password">
      {step === ChangePasswordSteps.VerifyCurrentPassword && (
        <Box
          as="form"
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          gap={6}
          justifyContent={JustifyContent.spaceBetween}
          height={BlockSize.Full}
          onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            handleSubmitCurrentPassword();
          }}
        >
          <FormTextField
            id="current-password"
            label={t('enterPasswordContinue')}
            placeholder={t('makeSureNoOneWatching')}
            textFieldProps={{ type: TextFieldType.Password }}
            size={FormTextFieldSize.Lg}
            labelProps={{
              marginBottom: 1,
              children: t('enterPasswordContinue'),
            }}
            inputProps={{
              autoFocus: true,
              'data-testid': 'verify-current-password-input',
            }}
            value={currentPassword}
            error={isIncorrectPasswordError}
            helpText={
              isIncorrectPasswordError ? t('unlockPageIncorrectPassword') : null
            }
            onChange={(e) => {
              setCurrentPassword(e.target.value);
              setIsIncorrectPasswordError(false);
            }}
          />

          <Button
            type="submit"
            block
            size={ButtonSize.Lg}
            disabled={isIncorrectPasswordError || !currentPassword}
            data-testid="verify-current-password-button"
          >
            {t('save')}
          </Button>
        </Box>
      )}

      {step === ChangePasswordSteps.ChangePassword && (
        <Box
          as="form"
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          gap={6}
          justifyContent={JustifyContent.spaceBetween}
          height={BlockSize.Full}
          onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            setShowChangePasswordWarning(true);
          }}
        >
          <Box>
            <PasswordForm
              onChange={(password) => setNewPassword(password)}
              pwdInputTestId="change-password-input"
              confirmPwdInputTestId="change-password-confirm-input"
            />
          </Box>
          <Button
            type="submit"
            disabled={!currentPassword || !newPassword}
            data-testid="change-password-button"
            block
          >
            {t('save')}
          </Button>
        </Box>
      )}

      {step === ChangePasswordSteps.ChangePasswordLoading && (
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          alignItems={AlignItems.center}
          marginTop={12}
        >
          <div>{renderMascot()}</div>
          <Spinner className="change-password__spinner" />
          <Text variant={TextVariant.bodyLgMedium} marginBottom={4}>
            {t('changePasswordLoading')}
          </Text>
          <Text variant={TextVariant.bodySm} color={TextColor.textAlternative}>
            {t('changePasswordLoadingNote')}
          </Text>
        </Box>
      )}
      {showChangePasswordWarning && (
        <ChangePasswordWarning
          onConfirm={() => {
            onChangePassword();
          }}
          onCancel={() => setShowChangePasswordWarning(false)}
        />
      )}
    </Box>
  );
};

export default ChangePassword;
