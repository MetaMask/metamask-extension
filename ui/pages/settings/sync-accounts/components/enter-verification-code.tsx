import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box,
  Text,
  TextAlign,
  TextVariant,
  TextColor,
  FontWeight,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
  Icon,
  IconName,
  IconSize,
  Button,
  ButtonSize,
} from '@metamask/design-system-react';
import { useSelector } from 'react-redux';
import { submitRequestToBackground } from '../../../../store/background-connection';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  QR_SYNC_TIMEOUT_MS,
  QrSyncErrorCodes,
} from '../../../../../shared/constants/qr-sync';
import { selectQrSyncError } from '../../../../selectors/qr-sync/qr-sync';

const CODE_LENGTH = 6;
const CELLS = Array.from({ length: CODE_LENGTH }, (_, index) => index);
const CONNECTING_HELPER_DELAY_MS = 1200;
const CONNECTING_HELPER_TEXT = 'Still connecting. Don’t close MetaMask mobile.';
// TODO: source this from the controller

const getCodeDigits = (text: string) =>
  text.replace(/\D/gu, '').slice(0, CODE_LENGTH);

const MWP_SESSION_REQUEST_EXPIRY_SECONDS =
  QR_SYNC_TIMEOUT_MS.MWP_SESSION_TIMEOUT / 1000;

type EnterVerificationCodeProps = {
  onRestart: () => void;
  isAwaitingSyncOffer?: boolean;
};

const EnterVerificationCode = ({
  onRestart,
  isAwaitingSyncOffer = false,
}: EnterVerificationCodeProps) => {
  const t = useI18nContext();
  const qrSyncError = useSelector(selectQrSyncError);
  const hasMaxedOutAttempts =
    qrSyncError?.code === QrSyncErrorCodes.OTP_ATTEMPTS_EXCEEDED;
  const [isError, setIsError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showConnectingHelper, setShowConnectingHelper] = useState(false);
  const [code, setCode] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(
    MWP_SESSION_REQUEST_EXPIRY_SECONDS,
  );
  const isExpired = secondsLeft <= 0;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAwaitingSyncOffer) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      setShowConnectingHelper(true);
    }, CONNECTING_HELPER_DELAY_MS);

    return () => clearTimeout(timeoutId);
  }, [isAwaitingSyncOffer]);

  useEffect(() => {
    if (isExpired) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      setSecondsLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isExpired]);

  const handleChange = useCallback(async (rawValue: string) => {
    const nextCode = getCodeDigits(rawValue);
    setCode(nextCode);
    setIsError(false);

    if (nextCode.length < CODE_LENGTH) {
      return;
    }

    setIsVerifying(true);
    setShowConnectingHelper(false);
    try {
      await submitRequestToBackground('QrSyncController:submitOtp', [nextCode]);
    } catch {
      setIsVerifying(false);
      setCode('');
      setIsError(true);
      inputRef.current?.focus();
    }
  }, []);

  let errorMessage: string | null = null;
  if (isExpired) {
    errorMessage = t('enter_verification_code_expired');
  } else if (hasMaxedOutAttempts) {
    errorMessage = t('enter_verification_code_max_attempts');
  } else if (isError) {
    errorMessage = t('enter_verification_code_error');
  }

  const getCellBorder = (index: number) => {
    return isFocused && index === Math.min(code.length, CODE_LENGTH - 1)
      ? 'border-primary-default'
      : 'border-muted';
  };

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      gap={6}
      paddingBottom={4}
      className="flex-1"
    >
      <Box flexDirection={BoxFlexDirection.Column} gap={2}>
        <Text
          variant={TextVariant.HeadingLg}
          color={TextColor.TextDefault}
          fontWeight={FontWeight.Bold}
        >
          {t('enter_verification_code')}
        </Text>
        <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
          {t('enter_verification_code_desc')}
        </Text>
      </Box>
      <Box
        flexDirection={BoxFlexDirection.Column}
        gap={2}
        paddingTop={2}
        className="w-full max-w-[414px]"
      >
        <Box className="relative">
          <Box flexDirection={BoxFlexDirection.Row} gap={2} aria-hidden="true">
            {CELLS.map((index) => (
              <Box
                key={index}
                data-testid={`qr-sync-otp-cell-${index}`}
                className={`flex-1 h-14 flex items-center justify-center rounded-xl border-[1.5px] bg-muted ${getCellBorder(
                  index,
                )}`}
              >
                <Text variant={TextVariant.HeadingMd} className="text-[22px]">
                  {code[index] ?? ''}
                </Text>
              </Box>
            ))}
          </Box>
          <input
            ref={inputRef}
            value={code}
            onChange={(event) => handleChange(event.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            spellCheck={false}
            autoCorrect="off"
            aria-label={t('enter_verification_code')}
            aria-invalid={Boolean(errorMessage)}
            maxLength={CODE_LENGTH}
            autoFocus
            disabled={
              isExpired ||
              hasMaxedOutAttempts ||
              isVerifying ||
              isAwaitingSyncOffer
            }
            data-testid="qr-sync-otp-input"
            className="absolute inset-0 w-full h-full opacity-0 cursor-text"
          />
        </Box>
        {(isVerifying || isAwaitingSyncOffer) &&
        !isExpired &&
        !hasMaxedOutAttempts ? (
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
            justifyContent={BoxJustifyContent.Center}
            paddingTop={2}
            className="w-full"
            role="status"
            aria-label={
              showConnectingHelper
                ? CONNECTING_HELPER_TEXT
                : t('mfaOtpVerifying')
            }
            data-testid="qr-sync-otp-verifying"
          >
            <Box
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Center}
              gap={2}
              className="max-w-[320px]"
            >
              <Icon
                name={IconName.Loading}
                size={IconSize.Sm}
                className="animate-spin shrink-0"
                aria-hidden
              />
              <Text
                variant={
                  showConnectingHelper ? TextVariant.BodyXs : TextVariant.BodySm
                }
                textAlign={TextAlign.Center}
                className={
                  showConnectingHelper ? 'whitespace-nowrap' : 'max-w-[280px]'
                }
              >
                {showConnectingHelper
                  ? CONNECTING_HELPER_TEXT
                  : t('mfaOtpVerifying')}
              </Text>
            </Box>
          </Box>
        ) : null}
        {errorMessage ? (
          <Text
            asChild
            variant={TextVariant.BodySm}
            fontWeight={FontWeight.Medium}
            color={TextColor.ErrorDefault}
          >
            <p role="alert">{errorMessage}</p>
          </Text>
        ) : null}
      </Box>
      {isExpired || hasMaxedOutAttempts ? (
        <Button
          size={ButtonSize.Lg}
          className="w-full mt-auto"
          onClick={onRestart}
          data-testid="qr-sync-otp-try-again"
        >
          {t('add_device_try_again')}
        </Button>
      ) : null}
    </Box>
  );
};

export default EnterVerificationCode;
