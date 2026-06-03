import EventEmitter from 'events';
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import log from 'loglevel';
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
  startPasskeyAuthentication,
  cancelPasskeyCeremony,
  isPasskeyCeremonySilentError,
  translatePasskeyError,
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
  generatePasskeyAuthenticationOptions,
  removePasskeyWithPasswordVerification,
  verifyPassword,
} from '../../../store/actions';
import {
  getIsPasskeyFeatureAvailable,
  getIsPasskeyRegistered,
  getIsSocialLoginFlow,
  getIsEnrolledPasskeyIncompatibleWithSidepanel,
} from '../../../selectors';
import { getEnvironmentType } from '../../../../shared/lib/environment-type';
import { ENVIRONMENT_TYPE_SIDEPANEL } from '../../../../shared/constants/app';
import PasswordForm from '../password-form/password-form';
import {
  SECURITY_AND_PASSWORD_ROUTE,
  SECURITY_PASSWORD_CHANGE_V2_ROUTE,
} from '../../../helpers/constants/routes';
import { toast, ToastContent } from '../../ui/toast/toast';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { useBoolean } from '../../../hooks/useBoolean';
import { SECOND } from '../../../../shared/constants/time';
import PasskeyTroubleshootModal from '../passkey-troubleshoot-modal';
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
  const { trackEvent } = useContext(MetaMetricsContext);
  const isSocialLoginFlow = useSelector(getIsSocialLoginFlow);
  const isPasskeyRegistered = useSelector(getIsPasskeyRegistered);
  const isPasskeyFeatureAvailable = useSelector(getIsPasskeyFeatureAvailable);
  const isPasskeyActive = isPasskeyRegistered && isPasskeyFeatureAvailable;
  const isEnrolledPasskeyIncompatibleWithSidepanel = useSelector(
    getIsEnrolledPasskeyIncompatibleWithSidepanel,
  );
  const isSidePanel = getEnvironmentType() === ENVIRONMENT_TYPE_SIDEPANEL;
  const mustDeferPasskeyToBrowserTab =
    isSidePanel &&
    isEnrolledPasskeyIncompatibleWithSidepanel &&
    isPasskeyActive;
  const animationEventEmitter = useRef(new EventEmitter());
  const hasDeferredPasskeyToBrowserTabRef = useRef(false);

  const [step, setStep] = useState(() =>
    isPasskeyActive && !mustDeferPasskeyToBrowserTab
      ? ChangePasswordSteps.VerifyPasskey
      : ChangePasswordSteps.VerifyCurrentPassword,
  );

  const [isVerifyingPasskey, setIsVerifyingPasskey] = useState(
    () => isPasskeyActive && !mustDeferPasskeyToBrowserTab,
  );

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
    trackEvent({
      category: MetaMetricsEventCategory.Settings,
      event: MetaMetricsEventName.PasswordChangeWithPasskey,
      properties: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        status: 'started',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        passkey_renewal_enabled: isPasskeyRenewalEnabled,
      },
    });

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

      trackEvent({
        category: MetaMetricsEventCategory.Settings,
        event: MetaMetricsEventName.PasswordChangeWithPasskey,
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          status: 'completed',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          duration_ms: Date.now() - startedAt,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          passkey_renewal_enabled: isPasskeyRenewalEnabled,
        },
      });
    } catch (error) {
      const errorCode = getPasskeyErrorCode(error);
      const durationMs = Date.now() - startedAt;
      trackEvent({
        category: MetaMetricsEventCategory.Settings,
        event: MetaMetricsEventName.PasswordChangeWithPasskey,
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          status: 'failed',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          passkey_renewal_enabled: isPasskeyRenewalEnabled,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          duration_ms: durationMs,
          reason: errorCode,
        },
      });

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
        if (isPasskeyRegistered) {
          await removePasskeyWithPasswordVerification(currentPassword);
          await forceUpdateMetamaskState(dispatch);
        }
        await dispatch(changePassword(newPassword, currentPassword));
      }

      // Track password changed event
      trackEvent({
        category: MetaMetricsEventCategory.Settings,
        event: MetaMetricsEventName.PasswordChanged,
        properties: {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          biometrics_enabled: isPasskeyRenewalSuccessful,
        },
      });

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

  const performPasskeyAuthentication = useCallback(async () => {
    setIsVerifyingPasskey(true);
    try {
      const authOptions = await generatePasskeyAuthenticationOptions();
      const response = await startPasskeyAuthentication(authOptions);
      return response;
    } catch (error: unknown) {
      if (isPasskeyCeremonySilentError(error)) {
        log.debug(
          'Passkey authentication from change-password toggle cancelled or timed out',
          error,
        );
      } else {
        captureException(
          createSentryError(
            'Passkey verification during change password failed',
            error,
          ),
        );
        toast.error(
          <ToastContent
            title={
              translatePasskeyError(
                error,
                t as (key: string, substitutions?: string[]) => string,
                passkeyMethodLabel,
              ) ?? t('passkeyErrorVerificationFailed', [passkeyMethodLabel])
            }
          />,
          { duration: autoHideToastDelay },
        );
      }
      return null;
    } finally {
      setIsVerifyingPasskey(false);
    }
  }, [passkeyMethodLabel, t]);

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

  // When a passkey is already enrolled, verify with WebAuthn on the dedicated step before new password.
  useEffect(() => {
    if (
      !isPasskeyActive ||
      mustDeferPasskeyToBrowserTab ||
      step !== ChangePasswordSteps.VerifyPasskey ||
      passkeyAuthenticationResponse !== null
    ) {
      return;
    }

    let aborted = false;

    (async () => {
      try {
        const response = await performPasskeyAuthentication();
        if (aborted) {
          return;
        }
        setPasskeyAuthenticationResponse(response);
        setIsPasskeyRenewalEnabled(Boolean(response));
        setCurrentPassword('');

        if (response) {
          setStep(ChangePasswordSteps.ChangePassword);
        } else {
          setStep(ChangePasswordSteps.VerifyCurrentPassword);
        }
      } catch {
        if (aborted) {
          return;
        }
        setPasskeyAuthenticationResponse(null);
        setIsPasskeyRenewalEnabled(false);
        setCurrentPassword('');
        setStep(ChangePasswordSteps.VerifyCurrentPassword);
      }
    })();

    return () => {
      aborted = true;
      cancelPasskeyCeremony();
      setIsVerifyingPasskey(false);
    };
  }, [
    isPasskeyActive,
    mustDeferPasskeyToBrowserTab,
    passkeyAuthenticationResponse,
    step,
    performPasskeyAuthentication,
  ]);

  const handleUseVerifyPassword = useCallback(() => {
    cancelPasskeyCeremony();
    setIsVerifyingPasskey(false);
    setPasskeyAuthenticationResponse(null);
    setIsPasskeyRenewalEnabled(false);
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

      const response = await performPasskeyAuthentication();
      setPasskeyAuthenticationResponse(response);
      setIsPasskeyRenewalEnabled(Boolean(response));
    },
    [
      isPasskeyActive,
      isVerifyingPasskey,
      passkeyAuthenticationResponse,
      performPasskeyAuthentication,
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
        <Box
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.Center}
          marginTop={12}
          gap={4}
          data-testid="change-password-passkey-verifying"
        >
          <Spinner className="change-password__spinner" />
          <Text
            variant={TextVariant.BodyLg}
            fontWeight={FontWeight.Medium}
            className="text-center"
          >
            {t('passkeyVerifyingTitle', [passkeyMethodLabel])}
          </Text>
          <Text
            variant={TextVariant.BodySm}
            color={TextColor.TextAlternative}
            className="text-center"
          >
            {t('passkeyVerifyingDescription', [passkeyMethodLabel])}
          </Text>
          {isSidePanel &&
          isVerifyingPasskey &&
          !mustDeferPasskeyToBrowserTab ? (
            <TextButton
              type="button"
              data-testid="change-password-passkey-verifying-open-full-screen"
              color={TextColor.PrimaryDefault}
              className="text-center"
              onClick={() => setShowPasskeyTroubleshootModal(true)}
            >
              {t('passkeyTroubleshootVerify')}
            </TextButton>
          ) : null}
          <TextButton
            type="button"
            data-testid="change-password-verify-passkey-use-password"
            color={TextColor.PrimaryDefault}
            className="text-center mt-4"
            onClick={handleUseVerifyPassword}
          >
            {t('usePassword')}
          </TextButton>
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
