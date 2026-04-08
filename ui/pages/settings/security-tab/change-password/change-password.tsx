import EventEmitter from 'events';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  ButtonSize,
  Checkbox,
  Text,
  TextVariant,
  TextColor,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
  FontWeight,
} from '@metamask/design-system-react';
import {
  FormTextField,
  FormTextFieldSize,
  TextFieldType,
} from '../../../../components/component-library';
import { isBeta, isFlask } from '../../../../../shared/lib/build-types';
import Mascot from '../../../../components/ui/mascot';
import Spinner from '../../../../components/ui/spinner';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  changePassword,
  checkIsSeedlessPasswordOutdated,
  verifyPassword,
} from '../../../../store/actions';
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
import { useBoolean } from '../../../../hooks/useBoolean';
import ChangePasswordWarning from './change-password-warning';

const ChangePasswordSteps = {
  VerifyCurrentPassword: 1,
  ChangePassword: 2,
  ChangePasswordLoading: 3,
};

type ChangePasswordProps = {
  redirectRoute?: string;
};

const ChangePassword = ({
  redirectRoute = SECURITY_ROUTE,
}: ChangePasswordProps) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { trackEvent } = useContext(MetaMetricsContext);
  const isSocialLoginFlow = useSelector(getIsSocialLoginFlow);
  const animationEventEmitter = useRef(new EventEmitter());
  const [step, setStep] = useState(ChangePasswordSteps.VerifyCurrentPassword);

  const [currentPassword, setCurrentPassword] = useState('');
  const [isIncorrectPasswordError, setIsIncorrectPasswordError] =
    useState(false);

  const { value: termsChecked, toggle } = useBoolean();
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
        },
      });

      // upon successful password change, go back to the settings page
      navigate(redirectRoute);
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

  useEffect(() => {
    (async () => {
      // check if the seedless password is outdated as long as the user land on the change password page
      if (isSocialLoginFlow) {
        await dispatch(checkIsSeedlessPasswordOutdated());
      }
    })();
  }, [dispatch, isSocialLoginFlow]);

  return (
    <Box padding={4} className="change-password">
      {step === ChangePasswordSteps.VerifyCurrentPassword && (
        <Box
          flexDirection={BoxFlexDirection.Column}
          gap={6}
          justifyContent={BoxJustifyContent.Between}
          asChild
          className="h-full"
        >
          <form
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
              className="w-full"
              size={ButtonSize.Lg}
              disabled={isIncorrectPasswordError || !currentPassword}
              data-testid="verify-current-password-button"
            >
              {t('continue')}
            </Button>
          </form>
        </Box>
      )}

      {step === ChangePasswordSteps.ChangePassword && (
        <Box
          flexDirection={BoxFlexDirection.Column}
          gap={6}
          justifyContent={BoxJustifyContent.Between}
          className="h-full"
          asChild
        >
          <form
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
                variant={TextVariant.BodyMd}
                color={TextColor.TextAlternative}
                className="mb-4"
              >
                {isSocialLoginFlow
                  ? t('changePasswordDetailsSocial')
                  : t('createPasswordDetails')}
              </Text>
              <PasswordForm
                onChange={(password) => setNewPassword(password)}
                pwdInputTestId="change-password-input"
                confirmPwdInputTestId="change-password-confirm-input"
              />
              <Box
                className="create-password__terms-container"
                flexDirection={BoxFlexDirection.Row}
                alignItems={BoxAlignItems.Center}
                justifyContent={BoxJustifyContent.Between}
                marginTop={6}
              >
                <Checkbox
                  id="change-password-terms"
                  data-testid="change-password-terms"
                  isSelected={termsChecked}
                  onChange={toggle}
                  label={
                    <>
                      {isSocialLoginFlow
                        ? t('passwordTermsWarningSocial')
                        : t('passwordTermsWarning')}
                      &nbsp;
                      {createPasswordLink}
                    </>
                  }
                  className="items-start flex"
                />
              </Box>
            </Box>
            <Button
              type="submit"
              disabled={!currentPassword || !newPassword || !termsChecked}
              data-testid="change-password-button"
              className="w-full"
            >
              {t('save')}
            </Button>
          </form>
        </Box>
      )}

      {step === ChangePasswordSteps.ChangePasswordLoading && (
        <Box
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.Center}
          marginTop={12}
        >
          <Box>{renderMascot()}</Box>
          <Spinner className="change-password__spinner" />
          <Text
            variant={TextVariant.BodyLg}
            fontWeight={FontWeight.Medium}
            className="mb-4"
          >
            {t('changePasswordLoading')}
          </Text>
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
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
