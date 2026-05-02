import EventEmitter from 'events';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { PasskeyAuthenticationResponse } from '@metamask/passkey-controller';
import {
  Box,
  Button,
  ButtonSize,
  Checkbox,
  Text,
  TextButton,
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
  startPasskeyAuthentication,
  cancelPasskeyCeremony,
} from '../../../../../shared/lib/passkey';
import {
  changePassword,
  changePasswordWithPasskeyVerification,
  checkIsSeedlessPasswordOutdated,
  forceUpdateMetamaskState,
  generatePasskeyAuthenticationOptions,
  removePasskeyWithPasswordVerification,
  verifyPassword,
} from '../../../../store/actions';
import PasswordForm from '../../../../components/app/password-form/password-form';
import {
  SECURITY_ROUTE,
  SECURITY_PASSWORD_CHANGE_V2_ROUTE,
} from '../../../../helpers/constants/routes';
import { toast, ToastContent } from '../../../../components/ui/toast/toast';
import {
  getIsPasskeyFeatureAvailable,
  getIsPasskeyRegistered,
  getIsSocialLoginFlow,
} from '../../../../selectors';
import ZENDESK_URLS from '../../../../helpers/constants/zendesk-url';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import { useBoolean } from '../../../../hooks/useBoolean';
import { SECOND } from '../../../../../shared/constants/time';
import { getEnvironmentType } from '../../../../../shared/lib/environment-type';
import { ENVIRONMENT_TYPE_SIDEPANEL } from '../../../../../shared/constants/app';
import ChangePasswordWarning from './change-password-warning';

const ChangePasswordSteps = {
  VerifyCurrentPassword: 1,
  ChangePassword: 2,
  ChangePasswordLoading: 3,
};

const autoHideToastDelay = 5 * SECOND;

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
  const isPasskeyRegistered = useSelector(getIsPasskeyRegistered);
  const isPasskeyFeatureAvailable = useSelector(getIsPasskeyFeatureAvailable);
  const isPasskeyActive = isPasskeyRegistered && isPasskeyFeatureAvailable;
  const animationEventEmitter = useRef(new EventEmitter());

  const [step, setStep] = useState(() =>
    isPasskeyActive
      ? ChangePasswordSteps.ChangePassword
      : ChangePasswordSteps.VerifyCurrentPassword,
  );

  const [isAwaitingPasskeyVerification, setIsAwaitingPasskeyVerification] =
    useState(isPasskeyActive);

  const [currentPassword, setCurrentPassword] = useState('');
  const [isIncorrectPasswordError, setIsIncorrectPasswordError] =
    useState(false);

  const { value: termsChecked, toggle } = useBoolean();
  const [newPassword, setNewPassword] = useState('');
  const [showChangePasswordWarning, setShowChangePasswordWarning] =
    useState(false);
  const [passkeyAuthenticationResponse, setPasskeyAuthenticationResponse] =
    useState<PasskeyAuthenticationResponse | null>(null);
  const passkeyAutoSuccessLockRef = useRef(false);

  const isSidePanel =
    getEnvironmentType() === ENVIRONMENT_TYPE_SIDEPANEL;

  const openChangePasswordInFullScreen = useCallback(() => {
    cancelPasskeyCeremony();
    globalThis.platform?.openExtensionInBrowser?.(
      SECURITY_PASSWORD_CHANGE_V2_ROUTE,
      'from=sidepanel',
    );
  }, []);

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
    let changedPasswordWithPasskeyVerification = false;
    try {
      setShowChangePasswordWarning(false);
      setStep(ChangePasswordSteps.ChangePasswordLoading);

      if (isSocialLoginFlow) {
        await dispatch(changePassword(newPassword, currentPassword));
      } else if (
        isPasskeyRegistered &&
        passkeyAuthenticationResponse !== null
      ) {
        changedPasswordWithPasskeyVerification = true;
        await dispatch(
          changePasswordWithPasskeyVerification(
            newPassword,
            passkeyAuthenticationResponse,
          ),
        );
        setPasskeyAuthenticationResponse(null);
        await forceUpdateMetamaskState(dispatch);
      } else {
        await dispatch(changePassword(newPassword, currentPassword));
        if (isPasskeyActive) {
          await removePasskeyWithPasswordVerification(newPassword);
          await forceUpdateMetamaskState(dispatch);
        }
      }

      // Track password changed event
      trackEvent({
        category: MetaMetricsEventCategory.Settings,
        event: MetaMetricsEventName.PasswordChanged,
        properties: {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          biometrics_enabled: Boolean(
            changedPasswordWithPasskeyVerification && !isSocialLoginFlow,
          ),
        },
      });

      // upon successful password change, go back to the settings page
      navigate(redirectRoute);
      toast.success(
        <ToastContent title={t('securityChangePasswordToastSuccess')} />,
        { duration: autoHideToastDelay },
      );
    } catch (error) {
      console.error(error);
      setStep(ChangePasswordSteps.ChangePassword);
      toast.error(
        <ToastContent title={t('securityChangePasswordToastError')} />,
        { duration: autoHideToastDelay },
      );
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

  useEffect(
    () => () => {
      cancelPasskeyCeremony();
    },
    [],
  );

  // When a passkey is already enrolled, verify with WebAuthn first — no "current password" step.
  useEffect(() => {
    if (
      !isPasskeyActive ||
      step !== ChangePasswordSteps.ChangePassword ||
      Boolean(currentPassword) ||
      passkeyAuthenticationResponse !== null ||
      passkeyAutoSuccessLockRef.current
    ) {
      return;
    }

    let cancelled = false;

    (async () => {
      setIsAwaitingPasskeyVerification(true);
      try {
        const authOptions = await generatePasskeyAuthenticationOptions();
        const response = await startPasskeyAuthentication(authOptions);
        if (!cancelled) {
          passkeyAutoSuccessLockRef.current = true;
          setPasskeyAuthenticationResponse(response);
        }
      } catch {
        if (!cancelled) {
          passkeyAutoSuccessLockRef.current = false;
          setPasskeyAuthenticationResponse(null);
          setCurrentPassword('');
          setStep(ChangePasswordSteps.VerifyCurrentPassword);
        }
      } finally {
        if (!cancelled) {
          setIsAwaitingPasskeyVerification(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      cancelPasskeyCeremony();
      setIsAwaitingPasskeyVerification(false);
    };
  }, [isPasskeyActive, step, currentPassword, passkeyAuthenticationResponse]);

  const hasPasskeyAssertionForSave =
    isPasskeyRegistered && passkeyAuthenticationResponse !== null;

  const hasCurrentVerification =
    isSocialLoginFlow || Boolean(currentPassword) || hasPasskeyAssertionForSave;

  /** Passkey-first flow: hide new-password UI until WebAuthn succeeds (or user falls back). */
  const isPasskeyFirstGateActive =
    isPasskeyActive &&
    step === ChangePasswordSteps.ChangePassword &&
    !currentPassword &&
    passkeyAuthenticationResponse === null &&
    isAwaitingPasskeyVerification;

  const isPasskeyVerificationLayout =
    step === ChangePasswordSteps.ChangePassword && isPasskeyFirstGateActive;

  return (
    <Box
      padding={4}
      className={
        isPasskeyVerificationLayout
          ? 'change-password flex h-full min-h-0 flex-1 flex-col'
          : 'change-password'
      }
    >
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
            {isSidePanel ? (
              <TextButton
                type="button"
                data-testid="change-password-passkey-fallback-open-full-screen"
                color={TextColor.PrimaryDefault}
                className="w-full text-center"
                onClick={openChangePasswordInFullScreen}
              >
                {t('passkeyTroubleshoot')}
              </TextButton>
            ) : null}
          </form>
        </Box>
      )}

      {step === ChangePasswordSteps.ChangePassword && (
        <Box
          flexDirection={BoxFlexDirection.Column}
          gap={isPasskeyVerificationLayout ? 0 : 6}
          justifyContent={
            isPasskeyVerificationLayout
              ? BoxJustifyContent.Center
              : BoxJustifyContent.Between
          }
          className={
            isPasskeyVerificationLayout
              ? 'flex h-full min-h-0 flex-1 flex-col'
              : 'h-full'
          }
          asChild
        >
          <form
            onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              if (isPasskeyFirstGateActive) {
                return;
              }
              if (isSocialLoginFlow) {
                setShowChangePasswordWarning(true);
              } else {
                onChangePassword();
              }
            }}
          >
            {isPasskeyVerificationLayout ? (
              <Box
                flexDirection={BoxFlexDirection.Column}
                alignItems={BoxAlignItems.Center}
                justifyContent={BoxJustifyContent.Center}
                gap={4}
                className="flex min-h-0 flex-1 flex-col px-2"
                data-testid="change-password-passkey-verifying"
              >
                <Spinner className="change-password__spinner" />
                <Text
                  variant={TextVariant.BodyLg}
                  fontWeight={FontWeight.Medium}
                  className="text-center"
                >
                  {t('changePasswordPasskeyVerifyingTitle')}
                </Text>
                <Text
                  variant={TextVariant.BodySm}
                  color={TextColor.TextAlternative}
                  className="text-center"
                >
                  {t('changePasswordPasskeyVerifyingDescription')}
                </Text>
                {isSidePanel && isAwaitingPasskeyVerification ? (
                  <TextButton
                    type="button"
                    data-testid="change-password-passkey-verifying-open-full-screen"
                    color={TextColor.PrimaryDefault}
                    className="w-full text-center"
                    onClick={openChangePasswordInFullScreen}
                  >
                    {t('passkeyTroubleshoot')}
                  </TextButton>
                ) : null}
              </Box>
            ) : (
              <>
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
                  {!isSocialLoginFlow &&
                  !hasPasskeyAssertionForSave &&
                  !currentPassword ? (
                    <Box marginTop={6}>
                      <FormTextField
                        id="change-password-current-for-save"
                        label={t('enterPasswordCurrent')}
                        textFieldProps={{ type: TextFieldType.Password }}
                        size={FormTextFieldSize.Lg}
                        labelProps={{ marginBottom: 1 }}
                        inputProps={{
                          'data-testid':
                            'change-password-current-wallet-password-input',
                        }}
                        value={currentPassword}
                        onChange={(e) => {
                          setCurrentPassword(e.target.value);
                        }}
                      />
                    </Box>
                  ) : null}
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
                      onChange={() => {
                        toggle();
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
                      className="items-start flex"
                    />
                  </Box>
                </Box>
                <Button
                  type="submit"
                  disabled={
                    !newPassword ||
                    !termsChecked ||
                    isAwaitingPasskeyVerification ||
                    !hasCurrentVerification
                  }
                  data-testid="change-password-button"
                  className="w-full"
                >
                  {t('save')}
                </Button>
              </>
            )}
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
