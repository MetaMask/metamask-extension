import EventEmitter from 'events';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { type PasskeyAuthenticationResponse } from '@metamask/passkey-controller';
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
} from '../../component-library';
import { isBeta, isFlask } from '../../../../shared/lib/build-types';
import Mascot from '../../ui/mascot';
import Spinner from '../../ui/spinner';
import ToggleButton from '../../ui/toggle-button';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { createSentryError } from '../../../../shared/lib/error';
import {
  getPasskeyAuthMethodKey,
  cancelPasskeyCeremony,
} from '../../../../shared/lib/passkey';
import { captureException } from '../../../../shared/lib/sentry';
import {
  ExtensionPasskeyErrorCode,
  getPasskeyErrorCode,
  getPasskeyControllerErrorCode,
} from '../../../../shared/lib/passkey/passkey-error';
import {
  changePassword,
  changePasswordWithPasskeyVerification,
  checkIsSeedlessPasswordOutdated,
  forceUpdateMetamaskState,
  removePasskeyWithPasswordVerification,
  verifyPassword,
} from '../../../store/actions';
import { getIsSocialLoginFlow } from '../../../selectors';
import {
  useIsPasskeyActive,
  useIsPasskeyIncompatibleInSidepanel,
} from '../../../hooks/usePasskeyAvailability';
import PasswordForm from '../password-form/password-form';
import {
  SECURITY_AND_PASSWORD_ROUTE,
  SECURITY_PASSWORD_CHANGE_V2_ROUTE,
} from '../../../helpers/constants/routes';
import { toast, ToastContent } from '../../ui/toast/toast';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';
import { useAnalytics } from '../../../hooks/useAnalytics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { useBoolean } from '../../../hooks/useBoolean';
import { SECOND } from '../../../../shared/constants/time';
import PasskeyTroubleshootModal from '../passkey-troubleshoot-modal';
import {
  PasskeyVerification,
  runPasskeyVerificationCeremony,
} from '../passkey-verification';
import { getEnvironmentType } from '../../../../shared/lib/environment-type';
import { ENVIRONMENT_TYPE_SIDEPANEL } from '../../../../shared/constants/app';
import ChangePasswordWarning from './change-password-warning';

const ChangePasswordSteps = {
  VerifyCurrentPassword: 1,
  VerifyPasskey: 2,
  ChangePassword: 3,
  ChangePasswordLoading: 4,
};

const autoHideToastDelay = 5 * SECOND;

type ChangePasswordProps = {
  redirectRoute?: string;
};

const ChangePassword = ({
  redirectRoute = SECURITY_AND_PASSWORD_ROUTE,
}: ChangePasswordProps) => {
  const t = useI18nContext();
  const passkeyMethodLabel = t(getPasskeyAuthMethodKey());
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { trackEvent, createEventBuilder } = useAnalytics();
  const isSocialLoginFlow = useSelector(getIsSocialLoginFlow);
  const isPasskeyActive = useIsPasskeyActive();
  const isPasskeyIncompatibleWithSidepanel =
    useIsPasskeyIncompatibleInSidepanel();
  const mustDeferPasskeyToBrowserTab =
    isPasskeyActive && isPasskeyIncompatibleWithSidepanel;
  const isSidePanel = getEnvironmentType() === ENVIRONMENT_TYPE_SIDEPANEL;
  const animationEventEmitter = useRef(new EventEmitter());
  const hasDeferredPasskeyToBrowserTabRef = useRef(false);

  const [step, setStep] = useState(() =>
    isPasskeyActive && !mustDeferPasskeyToBrowserTab
      ? ChangePasswordSteps.VerifyPasskey
      : ChangePasswordSteps.VerifyCurrentPassword,
  );

  const [isVerifyingPasskey, setIsVerifyingPasskey] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [isIncorrectPasswordError, setIsIncorrectPasswordError] =
    useState(false);

  const { value: termsChecked, toggle } = useBoolean();
  const [newPassword, setNewPassword] = useState('');
  const [showChangePasswordWarning, setShowChangePasswordWarning] =
    useState(false);
  const [passkeyAuthenticationResponse, setPasskeyAuthenticationResponse] =
    useState<PasskeyAuthenticationResponse | null>(null);
  const [isPasskeyRenewalEnabled, setIsPasskeyRenewalEnabled] = useState(false);
  const [showPasskeyTroubleshootModal, setShowPasskeyTroubleshootModal] =
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

  const handleChangePasswordWithPasskey = async (): Promise<boolean> => {
    if (!passkeyAuthenticationResponse) {
      return false;
    }

    const startedAt = Date.now();
    trackEvent(
      createEventBuilder(MetaMetricsEventName.PasswordChangeWithPasskey)
        .addCategory(MetaMetricsEventCategory.Settings)
        .addProperties({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          status: 'started',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          passkey_renewal_enabled: isPasskeyRenewalEnabled,
        })
        .build(),
    );

    let isPasskeyRenewed = false;
    try {
      await dispatch(
        changePasswordWithPasskeyVerification(
          newPassword,
          passkeyAuthenticationResponse,
          { renewVaultKeyProtection: isPasskeyRenewalEnabled },
        ),
      );
      isPasskeyRenewed = isPasskeyRenewalEnabled;

      trackEvent(
        createEventBuilder(MetaMetricsEventName.PasswordChangeWithPasskey)
          .addCategory(MetaMetricsEventCategory.Settings)
          .addProperties({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            status: 'completed',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            duration_ms: Date.now() - startedAt,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            passkey_renewal_enabled: isPasskeyRenewalEnabled,
          })
          .build(),
      );
    } catch (error) {
      const errorCode = getPasskeyErrorCode(error);
      const durationMs = Date.now() - startedAt;
      trackEvent(
        createEventBuilder(MetaMetricsEventName.PasswordChangeWithPasskey)
          .addCategory(MetaMetricsEventCategory.Settings)
          .addProperties({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            status: 'failed',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            passkey_renewal_enabled: isPasskeyRenewalEnabled,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            duration_ms: durationMs,
            reason: errorCode,
          })
          .build(),
      );

      captureException(
        createSentryError(
          'Change password with passkey verification failed',
          error,
        ),
        {
          extra: {
            isPasskeyRenewalEnabled,
            errorCode,
            durationMs,
          },
        },
      );

      // if passkey renewal is not enabled, it's either passkey verification failed or password change failed
      if (!isPasskeyRenewalEnabled) {
        throw error;
      }

      const passkeyCode = getPasskeyControllerErrorCode(error);
      // strictly treat vault key renewal failure as a password change success
      if (passkeyCode !== ExtensionPasskeyErrorCode.VaultKeyRenewalFailed) {
        throw error;
      }
    }

    setPasskeyAuthenticationResponse(null);
    await forceUpdateMetamaskState(dispatch);
    return isPasskeyRenewed;
  };

  const onChangePassword = async () => {
    let isPasskeyRenewalSuccessful = false;

    try {
      setShowChangePasswordWarning(false);
      setStep(ChangePasswordSteps.ChangePasswordLoading);

      if (isSocialLoginFlow) {
        await dispatch(changePassword(newPassword, currentPassword));
      } else if (passkeyAuthenticationResponse) {
        isPasskeyRenewalSuccessful = await handleChangePasswordWithPasskey();
      } else {
        // Remove enrollment before changing the password so a failure after
        // `changePassword` cannot leave an enrolled-but-invalid passkey on disk.
        if (isPasskeyActive) {
          await removePasskeyWithPasswordVerification(currentPassword);
          await forceUpdateMetamaskState(dispatch);
        }
        await dispatch(changePassword(newPassword, currentPassword));
      }

      // Track password changed event
      trackEvent(
        createEventBuilder(MetaMetricsEventName.PasswordChanged)
          .addCategory(MetaMetricsEventCategory.Settings)
          .addProperties({
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            biometrics_enabled: isPasskeyRenewalSuccessful,
          })
          .build(),
      );

      // upon successful password change, go back to the settings page
      navigate(redirectRoute);
      const isPasskeyRenewalToast =
        isPasskeyRenewalEnabled && !isPasskeyRenewalSuccessful;
      const toastTitle = isPasskeyRenewalToast
        ? t('securityChangePasswordToastPasskeyRenewalFailed', [
            passkeyMethodLabel,
          ])
        : t('securityChangePasswordToastSuccess');
      toast.success(<ToastContent title={toastTitle} />, {
        duration: autoHideToastDelay,
      });
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
    trackEvent(
      createEventBuilder(MetaMetricsEventName.ExternalLinkClicked)
        .addCategory(MetaMetricsEventCategory.Onboarding)
        .addProperties({
          text: 'Learn More',
          location: 'change_password',
          url: ZENDESK_URLS.PASSWORD_ARTICLE,
        })
        .build(),
    );
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

  const openChangePasswordInFullScreen = useCallback(() => {
    cancelPasskeyCeremony();
    globalThis.platform?.openExtensionInBrowser?.(
      SECURITY_PASSWORD_CHANGE_V2_ROUTE,
    );
  }, []);

  useEffect(() => {
    if (
      !mustDeferPasskeyToBrowserTab ||
      hasDeferredPasskeyToBrowserTabRef.current
    ) {
      return;
    }
    hasDeferredPasskeyToBrowserTabRef.current = true;
    openChangePasswordInFullScreen();
  }, [mustDeferPasskeyToBrowserTab, openChangePasswordInFullScreen]);

  const handleUseVerifyPassword = useCallback(() => {
    setPasskeyAuthenticationResponse(null);
    setIsPasskeyRenewalEnabled(false);
    setStep(ChangePasswordSteps.VerifyCurrentPassword);
  }, []);

  const handlePasskeyVerified = useCallback(
    (response: PasskeyAuthenticationResponse) => {
      setPasskeyAuthenticationResponse(response);
      setIsPasskeyRenewalEnabled(true);
      setCurrentPassword('');
      setStep(ChangePasswordSteps.ChangePassword);
    },
    [],
  );

  const handlePasskeyCeremonyFailed = useCallback(() => {
    setPasskeyAuthenticationResponse(null);
    setIsPasskeyRenewalEnabled(false);
    setCurrentPassword('');
    setStep(ChangePasswordSteps.VerifyCurrentPassword);
  }, []);

  const handlePasskeyToggle = useCallback(
    async (wasPasskeyRenewalEnabled: boolean) => {
      if (!isPasskeyActive || isVerifyingPasskey) {
        return;
      }

      const willEnablePasskeyRenewal = !wasPasskeyRenewalEnabled;
      if (!willEnablePasskeyRenewal) {
        setIsPasskeyRenewalEnabled(false);
        return;
      }

      if (passkeyAuthenticationResponse !== null) {
        setIsPasskeyRenewalEnabled(true);
        return;
      }

      setIsVerifyingPasskey(true);
      try {
        const response = await runPasskeyVerificationCeremony({
          sentryContext: 'Passkey authentication from change-password toggle',
          passkeyMethodLabel,
          t,
          showErrorToast: true,
          toastDurationMs: autoHideToastDelay,
        });
        setPasskeyAuthenticationResponse(response);
        setIsPasskeyRenewalEnabled(Boolean(response));
      } finally {
        setIsVerifyingPasskey(false);
      }
    },
    [
      isPasskeyActive,
      isVerifyingPasskey,
      passkeyAuthenticationResponse,
      passkeyMethodLabel,
      t,
    ],
  );

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

      {step === ChangePasswordSteps.VerifyPasskey && (
        <PasskeyVerification
          flow="change-password"
          autoRunOnMount={!mustDeferPasskeyToBrowserTab}
          deferToBrowserTab={mustDeferPasskeyToBrowserTab}
          troubleshootLocation="settings-change-password"
          onOpenFullScreen={openChangePasswordInFullScreen}
          showErrorToast
          toastDurationMs={autoHideToastDelay}
          onVerified={handlePasskeyVerified}
          onCeremonyFailed={handlePasskeyCeremonyFailed}
          onUsePassword={handleUseVerifyPassword}
        />
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
            <Box className="flex-1 overflow-y-auto">
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
              {isPasskeyActive ? (
                <Box
                  marginTop={6}
                  marginBottom={12}
                  flexDirection={BoxFlexDirection.Column}
                  gap={1}
                >
                  <Box
                    flexDirection={BoxFlexDirection.Row}
                    justifyContent={BoxJustifyContent.Between}
                    alignItems={BoxAlignItems.Center}
                  >
                    <Text
                      variant={TextVariant.BodyMd}
                      fontWeight={FontWeight.Medium}
                    >
                      {t('unlockWithPasskey', [passkeyMethodLabel])}
                    </Text>
                    <ToggleButton
                      value={isPasskeyRenewalEnabled}
                      onToggle={handlePasskeyToggle}
                      dataTestId="change-password-enable-passkey"
                      containerStyle={{ width: '40px' }}
                      disabled={isVerifyingPasskey}
                    />
                  </Box>
                  {isSidePanel &&
                  isVerifyingPasskey &&
                  !mustDeferPasskeyToBrowserTab ? (
                    <TextButton
                      type="button"
                      data-testid="change-password-passkey-toggle-open-full-screen"
                      color={TextColor.PrimaryDefault}
                      className="mt-2 flex w-full justify-start text-left"
                      onClick={() => setShowPasskeyTroubleshootModal(true)}
                    >
                      {t('passkeyTroubleshootVerify')}
                    </TextButton>
                  ) : null}
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
              disabled={
                (!passkeyAuthenticationResponse && !currentPassword) ||
                !newPassword ||
                !termsChecked ||
                isVerifyingPasskey
              }
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
      {showPasskeyTroubleshootModal ? (
        <PasskeyTroubleshootModal
          mode="verify"
          location="settings-change-password"
          onClose={() => setShowPasskeyTroubleshootModal(false)}
          onOpenFullScreen={openChangePasswordInFullScreen}
        />
      ) : null}
    </Box>
  );
};

export default ChangePassword;
