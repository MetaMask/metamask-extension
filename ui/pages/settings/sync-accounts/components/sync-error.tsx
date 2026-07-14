import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Button,
  ButtonVariant,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextAlign,
  TextColor,
  TextVariant,
  FontWeight,
  BoxFlexDirection,
  BoxAlignItems,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { selectQrSyncError } from '../../../../selectors/qr-sync/qr-sync';
import { QrSyncErrorCodes } from '../../../../../shared/constants/qr-sync';
import { submitRequestToBackground } from '../../../../store/background-connection';

type QrSyncErrorCode = (typeof QrSyncErrorCodes)[keyof typeof QrSyncErrorCodes];

// Codes present in QR_SYNC_ERROR_PHASE_OVERRIDES (e.g. QR_EXPIRED, OTP_EXPIRED)
// are routed back to an earlier step and never reach this screen, so they are
// intentionally omitted here.
const ERROR_CODE_TO_MESSAGE_KEY: Partial<Record<QrSyncErrorCode, string>> = {
  [QrSyncErrorCodes.CHANNEL_DISCONNECTED]: 'add_device_error_connection',
  [QrSyncErrorCodes.SESSION_EXPIRED]: 'add_device_error_expired',
  [QrSyncErrorCodes.OTP_INVALID]: 'add_device_error_invalid_code',
  [QrSyncErrorCodes.SYNC_REJECTED]: 'add_device_error_rejected',
  [QrSyncErrorCodes.SYNC_FAILED]: 'add_device_error_sync_failed',
  [QrSyncErrorCodes.UNKNOWN]: 'add_device_error_generic',
};

const SyncError = () => {
  const t = useI18nContext();
  const qrSyncError = useSelector(selectQrSyncError);

  const messageKey = qrSyncError
    ? (ERROR_CODE_TO_MESSAGE_KEY[qrSyncError.code] ??
      'add_device_error_generic')
    : 'add_device_error_generic';

  const onRestart = useCallback(async () => {
    await submitRequestToBackground<void>('messengerCall', [
      'QrSyncController:createSession',
      [],
    ]).catch(() => undefined);
  }, []);

  const onCancel = useCallback(async () => {
    await submitRequestToBackground<void>('messengerCall', [
      'QrSyncController:cancelSync',
      [],
    ]).catch(() => undefined);
  }, []);

  return (
    <Box
      alignItems={BoxAlignItems.Center}
      flexDirection={BoxFlexDirection.Column}
      gap={8}
      paddingTop={8}
      className="flex-1"
    >
      <Box
        className="text-center"
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Center}
        gap={2}
      >
        <Icon
          name={IconName.Danger}
          size={IconSize.Xl}
          color={IconColor.ErrorDefault}
          className="mx-auto"
        />
        <Text
          variant={TextVariant.HeadingLg}
          color={TextColor.TextDefault}
          fontWeight={FontWeight.Bold}
          textAlign={TextAlign.Center}
        >
          {t('add_device_error_title')}
        </Text>
        <Text
          variant={TextVariant.BodyMd}
          color={TextColor.TextAlternative}
          textAlign={TextAlign.Center}
        >
          {t(messageKey)}
        </Text>
      </Box>
      <Box
        flexDirection={BoxFlexDirection.Column}
        gap={2}
        className="w-full mt-auto"
      >
        <Button className="w-full" onClick={onRestart}>
          {t('add_device_try_again')}
        </Button>
        <Button
          className="w-full"
          variant={ButtonVariant.Secondary}
          onClick={onCancel}
        >
          {t('cancel')}
        </Button>
      </Box>
    </Box>
  );
};

export default SyncError;
