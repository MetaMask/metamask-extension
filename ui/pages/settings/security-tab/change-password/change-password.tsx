import EventEmitter from 'events';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import {
  Box,
  Button,
  FormTextField,
  Text,
  TextFieldType,
} from '../../../../components/component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { isBeta, isFlask } from '../../../../helpers/utils/build-types';
import Mascot from '../../../../components/ui/mascot';
import Spinner from '../../../../components/ui/spinner';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { changePassword, verifyPassword } from '../../../../store/actions';
import PasswordForm from '../../../../components/app/password-form/password-form';
import ChangePasswordWarning from './change-password-warning';

const ChangePasswordSteps = {
  CurrentPassword: 1,
  ChangePassword: 2,
  CreatingPassword: 3,
};

const ChangePassword = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const history = useHistory();
  const [eventEmitter] = useState(new EventEmitter());
  const [step, setStep] = useState(ChangePasswordSteps.CurrentPassword);

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
      setStep(ChangePasswordSteps.CreatingPassword);
      await dispatch(changePassword(newPassword, currentPassword));

      // upon successful password change, go back to the settings page
      history.goBack();
    } catch (error) {
      setIsIncorrectPasswordError(true);
    } finally {
      setStep(ChangePasswordSteps.CreatingPassword);
    }
  };

  const onSubmitChangePasswordForm = () => {
    if (!newPassword) {
      return;
    }
    setShowChangePasswordWarning(true);
  };

  return (
    <div className="change-password">
      {step === ChangePasswordSteps.CurrentPassword && (
        <form
          className="change-password__form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmitCurrentPassword();
          }}
        >
          <Box className="change-password__form-container">
            <FormTextField
              id="current-password"
              label={t('enterPasswordContinue')}
              placeholder={t('makeSureNoOneWatching')}
              textFieldProps={{ type: TextFieldType.Password }}
              labelProps={{
                marginBottom: 1,
                children: t('enterPasswordContinue'),
              }}
              value={currentPassword}
              error={isIncorrectPasswordError}
              helpText={
                isIncorrectPasswordError
                  ? t('unlockPageIncorrectPassword')
                  : null
              }
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                setIsIncorrectPasswordError(false);
              }}
            />

            <Button
              type="submit"
              block
              disabled={isIncorrectPasswordError || !currentPassword}
            >
              {t('save')}
            </Button>
          </Box>
        </form>
      )}

      {step === ChangePasswordSteps.ChangePassword && (
        <form
          className="change-password__form"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmitChangePasswordForm();
          }}
        >
          <Box className="change-password__form-container">
            <div className="change-password__form-container__content">
              <PasswordForm onChange={(password) => setNewPassword(password)} />
            </div>
            <Button type="submit" disabled={!newPassword} block>
              {t('save')}
            </Button>
          </Box>
        </form>
      )}

      {step === ChangePasswordSteps.CreatingPassword && (
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          alignItems={AlignItems.center}
          marginTop={12}
        >
          <div>{renderMascot()}</div>
          <Spinner className="change-password__spinner" />
          <Text variant={TextVariant.bodyLgMedium} marginBottom={4}>
            {t('createPasswordCreating')}
          </Text>
          <Text variant={TextVariant.bodySm} color={TextColor.textAlternative}>
            {t('createPasswordCreatingNote')}
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
    </div>
  );
};

export default ChangePassword;
