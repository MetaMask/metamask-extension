import EventEmitter from 'events';
import React, { useContext, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import {
  Box,
  Button,
  ButtonSize,
  Checkbox,
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
import { SECURITY_ROUTE } from '../../../../helpers/constants/routes';
import { setShowPasswordChangeToast } from '../../../../components/app/toast-master/utils';
import { PasswordChangeToastType } from '../../../../../shared/constants/app-state';
import { getIsSocialLoginFlow } from '../../../../selectors';
import ZENDESK_URLS from '../../../../helpers/constants/zendesk-url';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import { getPasswordStrengthCategory } from '../../../../helpers/utils/common.util';
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
  const isSocialLoginFlow = useSelector(getIsSocialLoginFlow);
  const animationEventEmitter = useRef(new EventEmitter());
  const [step, setStep] = useState(ChangePasswordSteps.VerifyCurrentPassword);

  const [currentPassword, setCurrentPassword] = useState('');
  const [isIncorrectPasswordError, setIsIncorrectPasswordError] =
    useState(false);

  const [termsChecked, setTermsChecked] = useState(false);
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
      <Mascot
        animationEventEmitter={animationEventEmitter.current}
        width="100"
        height="100"
      />
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
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          biometrics_enabled: false,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          password_strength: getPasswordStrengthCategory(newPassword),
        },
      });

      // upon successful password change, go back to the settings page
      history.push(SECURITY_ROUTE);
      dispatch(setShowPasswordChangeToast(PasswordChangeToastType.Success));
    } catch (error) {
      console.error(error);
      setStep(ChangePasswordSteps.ChangePassword);
      dispatch(setShowPasswordChangeToast(PasswordChangeToastType.Errored));
    }
  };

  const handleLearnMoreClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.stopPropagation();
    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.ExternalLinkClicked,
      properties: {
        text: 'Learn More',
        location: 'change_password',
        url: ZENDESK_URLS.PASSWORD_ARTICLE,
      },
    });
  };

  const createPasswordLink = (
    <a
      onClick={handleLearnMoreClick}
      key="change-password__link-text"
      href={ZENDESK_URLS.PASSWORD_ARTICLE}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span className="change-password__link-text">
        {t('learnMoreUpperCaseWithDot')}
      </span>
    </a>
  );

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
            label={t('enterPasswordCurrent')}
            textFieldProps={{ type: TextFieldType.Password }}
            size={FormTextFieldSize.Lg}
            labelProps={{
              marginBottom: 1,
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
            {t('continue')}
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
            if (isSocialLoginFlow) {
              setShowChangePasswordWarning(true);
            } else {
              onChangePassword();
            }
          }}
        >
          <Box>
            <Text
              variant={TextVariant.bodyMd}
              color={TextColor.textAlternative}
              marginBottom={4}
              as="h2"
            >
              {isSocialLoginFlow
                ? t('createPasswordDetailsSocial')
                : t('createPasswordDetails')}
            </Text>
            <PasswordForm
              onChange={(password) => setNewPassword(password)}
              pwdInputTestId="change-password-input"
              confirmPwdInputTestId="change-password-confirm-input"
            />
            <Box
              className="create-password__terms-container"
              alignItems={AlignItems.center}
              justifyContent={JustifyContent.spaceBetween}
              marginTop={6}
            >
              <Checkbox
                inputProps={{ 'data-testid': 'change-password-terms' }}
                alignItems={AlignItems.flexStart}
                isChecked={termsChecked}
                onChange={() => {
                  setTermsChecked(!termsChecked);
                }}
                label={
                  <>
                    {isSocialLoginFlow
                      ? t('passwordTermsWarningSocial')
                      : t('passwordTermsWarning')}
                    &nbsp;
                    {createPasswordLink}
                  </>
                }
              />
            </Box>
          </Box>
          <Button
            type="submit"
            disabled={!currentPassword || !newPassword || !termsChecked}
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
