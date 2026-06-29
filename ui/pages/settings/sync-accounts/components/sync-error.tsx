import React, { useCallback } from 'react';
import {
  Box,
  Button,
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
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { submitRequestToBackground } from '../../../../store/background-connection';
import { selectQrSyncError } from '../../../../selectors/qr-sync/qr-sync';

const SyncError = () => {
  const t = useI18nContext();
  const qrSyncError = useSelector(selectQrSyncError);

  const handleRestart = useCallback(async () => {
    await submitRequestToBackground<void>('messengerCall', [
      'QrSyncController:createSession',
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
          {qrSyncError?.message ?? t('add_device_error_desc')}
        </Text>
      </Box>
      <Button className="w-full mt-10" onClick={handleRestart}>
        {t('start_with_new_qr_code')}
      </Button>
    </Box>
  );
};

export default SyncError;
