import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  BannerAlert,
  BannerAlertSeverity,
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  Button,
  ButtonSize,
  ButtonVariant,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  TextButton,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import {
  FormTextField,
  FormTextFieldSize,
  TextFieldType,
} from '../../component-library';
import {
  getPasskeyAuthMethodKey,
  isPasskeyCeremonySilentError,
  translatePasskeyError,
} from '../../../../shared/lib/passkey';
import {
  getPasskeyErrorCode,
  type TranslateFn,
} from '../../../../shared/lib/passkey/passkey-error';
import { createSentryError } from '../../../../shared/lib/error';
import { captureException } from '../../../../shared/lib/sentry';
import {
  forceUpdateMetamaskState,
  verifyPassword,
} from '../../../store/actions';
import { useDispatch } from '../../../store/hooks';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { usePasskeyReplacement } from '../../../hooks/passkey/usePasskeyReplacement';
import {
  PasskeyEnrollmentSteps,
  type PasskeyEnrollmentStepStatus,
} from '../passkey-enrollment-steps';

const DEFAULT_STEP_STATUS: PasskeyEnrollmentStepStatus = 'idle';

type PasskeyReplacementStep = 'password' | 'ceremony';

export type PasskeyReplacementModalProps = Readonly<{
  onComplete: () => void | Promise<void>;
  onRemindMeLater: () => void | Promise<void>;
}>;

/**
 * Collects the wallet password and runs the atomic legacy passkey replacement
 * ceremony.
 *
 * @param options0 - Component props.
 * @param options0.onComplete - Called after Redux has refreshed with the new
 * PRF-backed passkey record.
 * @param options0.onRemindMeLater - Called when the user leaves the migration
 * flow without replacing the passkey.
 */
export default function PasskeyReplacementModal({
  onComplete,
  onRemindMeLater,
}: PasskeyReplacementModalProps) {
  const t = useI18nContext() as TranslateFn;
  const dispatch = useDispatch();
  const { replacePasskey } = usePasskeyReplacement();
  const passkeyMethodLabel = t(getPasskeyAuthMethodKey());
  const [step, setStep] = useState<PasskeyReplacementStep>('password');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [replacementError, setReplacementError] = useState<string | null>(null);
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);
  const [isReplacementInProgress, setIsReplacementInProgress] = useState(false);
  const [registerStepStatus, setRegisterStepStatus] =
    useState<PasskeyEnrollmentStepStatus>(DEFAULT_STEP_STATUS);
  const [verifyStepStatus, setVerifyStepStatus] =
    useState<PasskeyEnrollmentStepStatus>(DEFAULT_STEP_STATUS);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleRemindMeLater = useCallback(() => {
    if (isVerifyingPassword || isReplacementInProgress) {
      return;
    }
    Promise.resolve(onRemindMeLater()).catch(() => undefined);
  }, [isReplacementInProgress, isVerifyingPassword, onRemindMeLater]);

  const handleReplacementStageChange = useCallback(
    (replacementStage: 'register' | 'verify' | 'complete') => {
      if (!isMountedRef.current) {
        return;
      }

      if (replacementStage === 'register') {
        setRegisterStepStatus('loading');
        setVerifyStepStatus(DEFAULT_STEP_STATUS);
      } else if (replacementStage === 'verify') {
        setRegisterStepStatus('success');
        setVerifyStepStatus('loading');
      } else {
        setRegisterStepStatus('success');
        setVerifyStepStatus('success');
      }
    },
    [],
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isVerifyingPassword || isReplacementInProgress || !password) {
      return;
    }

    setPasswordError(false);
    setReplacementError(null);
    setIsVerifyingPassword(true);

    try {
      await verifyPassword(password);
    } catch {
      if (isMountedRef.current) {
        setPasswordError(true);
      }
      setIsVerifyingPassword(false);
      return;
    }

    if (!isMountedRef.current) {
      return;
    }

    setIsVerifyingPassword(false);
    setStep('ceremony');
    setIsReplacementInProgress(true);
    handleReplacementStageChange('register');

    try {
      await replacePasskey({
        password,
        onStageChange: handleReplacementStageChange,
      });
      await forceUpdateMetamaskState(dispatch);
      if (isMountedRef.current) {
        await onComplete();
      }
    } catch (error) {
      if (!isMountedRef.current) {
        return;
      }

      if (isPasskeyCeremonySilentError(error)) {
        setReplacementError(null);
      } else {
        const errorCode = getPasskeyErrorCode(error);
        captureException(createSentryError('Passkey migration failed', error), {
          extra: { errorCode },
        });
        setReplacementError(
          translatePasskeyError(error, t, passkeyMethodLabel) ??
            t('passkeyErrorRegistrationFailed', [passkeyMethodLabel]),
        );
      }
      setPassword('');
      setStep('password');
      setRegisterStepStatus(DEFAULT_STEP_STATUS);
      setVerifyStepStatus(DEFAULT_STEP_STATUS);
    } finally {
      if (isMountedRef.current) {
        setIsReplacementInProgress(false);
      }
    }
  };

  return (
    <Modal
      isOpen
      onClose={handleRemindMeLater}
      isClosedOnOutsideClick={false}
      isClosedOnEscapeKey={false}
      data-testid="passkey-replacement-modal"
    >
      <ModalOverlay />
      <ModalContent
        className="items-center"
        modalDialogProps={{
          flexDirection: BoxFlexDirection.Column,
        }}
      >
        <ModalHeader>
          <Box
            flexDirection={BoxFlexDirection.Column}
            alignItems={BoxAlignItems.Center}
            gap={4}
          >
            <img
              src="images/biometric.png"
              alt="Biometrics"
              width={160}
              height={160}
            />
            <Text variant={TextVariant.HeadingMd}>
              {step === 'password'
                ? t('passkeyMigrationTitle')
                : t('settingUpPasskey', [passkeyMethodLabel])}
            </Text>
          </Box>
        </ModalHeader>

        {step === 'password' ? (
          <Box
            flexDirection={BoxFlexDirection.Column}
            gap={4}
            paddingHorizontal={4}
            className="w-full"
            asChild
          >
            <form onSubmit={handleSubmit}>
              <Text
                variant={TextVariant.BodyMd}
                color={TextColor.TextAlternative}
              >
                {t('enterPasswordContinue')}
              </Text>
              <FormTextField
                id="passkey-replacement-password"
                label={t('enterPasswordCurrent')}
                textFieldProps={{ type: TextFieldType.Password }}
                size={FormTextFieldSize.Lg}
                inputProps={{
                  autoFocus: true,
                  'data-testid': 'passkey-replacement-password-input',
                }}
                value={password}
                error={passwordError}
                helpText={
                  passwordError ? t('unlockPageIncorrectPassword') : null
                }
                onChange={(event) => {
                  setPassword(event.target.value);
                  setPasswordError(false);
                }}
              />
              {replacementError ? (
                <BannerAlert
                  severity={BannerAlertSeverity.Danger}
                  description={replacementError}
                  data-testid="passkey-replacement-error"
                />
              ) : null}
              <Button
                type="submit"
                variant={ButtonVariant.Primary}
                size={ButtonSize.Lg}
                className="w-full"
                disabled={
                  !password || isVerifyingPassword || isReplacementInProgress
                }
                isLoading={isVerifyingPassword}
                data-testid="passkey-replacement-continue-button"
              >
                {t('continue')}
              </Button>
            </form>
          </Box>
        ) : (
          <Box
            flexDirection={BoxFlexDirection.Column}
            gap={4}
            paddingHorizontal={4}
            paddingBottom={4}
            className="w-full"
            aria-busy={isReplacementInProgress}
          >
            <PasskeyEnrollmentSteps
              registerStatus={registerStepStatus}
              verifyStatus={verifyStepStatus}
              registerLabel={t('passkeySetupStepRegister', [
                passkeyMethodLabel,
              ])}
              verifyLabel={t('passkeySetupStepVerify', [passkeyMethodLabel])}
              className="w-full"
            />
          </Box>
        )}

        <ModalFooter>
          <TextButton
            type="button"
            color={TextColor.PrimaryDefault}
            onClick={handleRemindMeLater}
            disabled={isVerifyingPassword || isReplacementInProgress}
            data-testid="passkey-replacement-remind-me-later-button"
          >
            {t('remindMeLater')}
          </TextButton>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
