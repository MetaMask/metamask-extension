import EventEmitter from 'events';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { PasskeyAuthenticationResponse } from '@metamask/passkey-controller';
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
  startPasskeyRegistration,
  startPasskeyAuthentication,
  cancelPasskeyCeremony,
} from '../../../../../shared/lib/passkey';
import { getEnvironmentType } from '../../../../../shared/lib/environment-type';
import { ENVIRONMENT_TYPE_SIDEPANEL } from '../../../../../shared/constants/app';
import {
  changePassword,
  changePasswordWithPasskeyVerification,
  checkIsSeedlessPasswordOutdated,
  protectVaultKeyWithPasskey,
  forceUpdateMetamaskState,
  generatePasskeyAuthenticationOptions,
  generatePasskeyRegistrationOptions,
  removePasskeyWithPasswordVerification,
  verifyPassword,
} from '../../../../store/actions';
import PasswordForm from '../../../../components/app/password-form/password-form';
import {
  SECURITY_PASSWORD_CHANGE_ROUTE,
  SECURITY_REGISTER_PASSKEY_ROUTE,
  SECURITY_ROUTE,
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
import { SettingsToggleItem } from '../../../settings-v2/shared/settings-toggle-item';
import ChangePasswordWarning from './change-password-warning';
import { applyChangePasswordBiometricsToggle } from './change-password-biometrics';

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
  const autoPasskeyPromptStartedRef = useRef(false);
  /** After first passkey auth or password verify, do not show the full-screen passkey gate again (e.g. biometrics toggle). */
  const initialPasskeyGateDoneRef = useRef(false);

  const shouldSkipCurrentPasswordStep = isPasskeyActive;

  const [step, setStep] = useState(() =>
    shouldSkipCurrentPasswordStep
      ? ChangePasswordSteps.ChangePassword
      : ChangePasswordSteps.VerifyCurrentPassword,
  );

  const [isAwaitingPasskeyVerification, setIsAwaitingPasskeyVerification] =
    useState(shouldSkipCurrentPasswordStep);

  const [currentPassword, setCurrentPassword] = useState('');
  const [isIncorrectPasswordError, setIsIncorrectPasswordError] =
    useState(false);

  const { value: termsChecked, toggle } = useBoolean();
  const [newPassword, setNewPassword] = useState('');
  const [showChangePasswordWarning, setShowChangePasswordWarning] =
    useState(false);
  const [enableBiometrics, setEnableBiometrics] = useState(
    () => isPasskeyActive,
  );
  const [passkeyAuthenticationResponse, setPasskeyAuthenticationResponse] =
    useState<PasskeyAuthenticationResponse | null>(null);

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
      initialPasskeyGateDoneRef.current = true;
      setStep(ChangePasswordSteps.ChangePassword);
    } catch (error) {
      setIsIncorrectPasswordError(true);
    }
  };

  const onChangePassword = async () => {
    try {
      setShowChangePasswordWarning(false);
      setStep(ChangePasswordSteps.ChangePasswordLoading);

      if (isSocialLoginFlow) {
        await dispatch(changePassword(newPassword, currentPassword));
      } else if (enableBiometrics && isPasskeyRegistered) {
        // authenticate with passkey
        let authenticationResponse = passkeyAuthenticationResponse;
        if (!authenticationResponse) {
          const authOptions = await generatePasskeyAuthenticationOptions();
          authenticationResponse =
            await startPasskeyAuthentication(authOptions);
        }

        // change password with passkey verification
        await dispatch(
          changePasswordWithPasskeyVerification(
            newPassword,
            authenticationResponse,
          ),
        );
        setPasskeyAuthenticationResponse(null);
        await forceUpdateMetamaskState(dispatch);
      } else if (
        !enableBiometrics &&
        isPasskeyRegistered &&
        passkeyAuthenticationResponse !== null
      ) {
        await dispatch(
          changePasswordWithPasskeyVerification(
            newPassword,
            passkeyAuthenticationResponse,
          ),
        );
        await removePasskeyWithPasswordVerification(newPassword);
        setPasskeyAuthenticationResponse(null);
        await forceUpdateMetamaskState(dispatch);
      } else if (enableBiometrics && !isPasskeyRegistered) {
        await dispatch(changePassword(newPassword, currentPassword));

        if (getEnvironmentType() === ENVIRONMENT_TYPE_SIDEPANEL) {
          trackEvent({
            category: MetaMetricsEventCategory.Settings,
            event: MetaMetricsEventName.PasswordChanged,
            properties: {
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              biometrics_enabled: true,
            },
          });
          global.platform?.openExtensionInBrowser?.(
            SECURITY_REGISTER_PASSKEY_ROUTE,
            'from=change-password',
          );
          return;
        }

        const regOptions = await generatePasskeyRegistrationOptions();
        const registrationResponse = await startPasskeyRegistration(regOptions);
        await protectVaultKeyWithPasskey(registrationResponse);
        await forceUpdateMetamaskState(dispatch);
      } else {
        await dispatch(changePassword(newPassword, currentPassword));
      }

      // Track password changed event
      trackEvent({
        category: MetaMetricsEventCategory.Settings,
        event: MetaMetricsEventName.PasswordChanged,
        properties: {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          biometrics_enabled: Boolean(enableBiometrics && !isSocialLoginFlow),
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

  // When a passkey is already enrolled, verify with WebAuthn first — no "current password" step.
  useEffect(() => {
    if (
      !isPasskeyActive ||
      !enableBiometrics ||
      step !== ChangePasswordSteps.ChangePassword ||
      Boolean(currentPassword) ||
      passkeyAuthenticationResponse !== null ||
      autoPasskeyPromptStartedRef.current ||
      initialPasskeyGateDoneRef.current
    ) {
      return;
    }

    autoPasskeyPromptStartedRef.current = true;
    let cancelled = false;

    (async () => {
      setIsAwaitingPasskeyVerification(true);
      try {
        const authOptions = await generatePasskeyAuthenticationOptions();
        const response = await startPasskeyAuthentication(authOptions);
        if (!cancelled) {
          initialPasskeyGateDoneRef.current = true;
          setPasskeyAuthenticationResponse(response);
        }
      } catch {
        if (!cancelled) {
          autoPasskeyPromptStartedRef.current = false;
          initialPasskeyGateDoneRef.current = false;
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
      // Allow a follow-up effect run (e.g. React Strict Mode remount) to start WebAuthn again.
      autoPasskeyPromptStartedRef.current = false;
      setIsAwaitingPasskeyVerification(false);
    };
  }, [
    isPasskeyActive,
    enableBiometrics,
    step,
    currentPassword,
    passkeyAuthenticationResponse,
  ]);

  const hasPasskeyAssertionForSave =
    isPasskeyRegistered && passkeyAuthenticationResponse !== null;

  const hasCurrentVerification =
    isSocialLoginFlow || Boolean(currentPassword) || hasPasskeyAssertionForSave;

  /** Passkey-first flow: hide new-password UI until WebAuthn succeeds (or user falls back). */
  const isPasskeyFirstGateActive =
    !initialPasskeyGateDoneRef.current &&
    isPasskeyActive &&
    !currentPassword &&
    enableBiometrics &&
    passkeyAuthenticationResponse === null;

  const isPasskeyVerificationLayout =
    step === ChangePasswordSteps.ChangePassword && isPasskeyFirstGateActive;

  const openChangePasswordInFullScreen = () => {
    cancelPasskeyCeremony();
    global.platform?.openExtensionInBrowser?.(
      SECURITY_PASSWORD_CHANGE_ROUTE,
      'from=sidepanel',
    );
  };

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
                className="flex min-h-0 flex-1 flex-col"
                data-testid="change-password-passkey-verifying"
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
                  !enableBiometrics &&
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
                  {isSocialLoginFlow || !isPasskeyFeatureAvailable ? null : (
                    <Box marginTop={6}>
                      <SettingsToggleItem
                        title={t('unlockWithBiometricsToggle')}
                        description={t('biometricsToggleDescription')}
                        value={enableBiometrics}
                        onToggle={(current) => {
                          applyChangePasswordBiometricsToggle({
                            nextChecked: !current,
                            setEnableBiometrics,
                          });
                        }}
                        dataTestId="change-password-enable-biometrics"
                      />
                    </Box>
                  )}
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
