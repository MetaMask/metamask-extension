import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  BoxJustifyContent,
  Button,
  ButtonSize,
  ButtonVariant,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextAlign,
  TextColor,
  TextVariant,
  type BoxSpacing,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  CameraAccessErrorContentVariant,
  type CameraAccessErrorContentProps,
} from './camera-access-error-content.types';

const DEFAULT_ROOT_PADDING: BoxSpacing = 4;

export const CameraAccessErrorContent = (
  props: CameraAccessErrorContentProps,
) => {
  const t = useI18nContext();
  const { variant, onContinue, continueLoading = false } = props;

  const rootPaddingHorizontal: BoxSpacing =
    props.rootPaddingHorizontal ?? DEFAULT_ROOT_PADDING;
  const rootPaddingBottom: BoxSpacing =
    props.rootPaddingBottom ?? DEFAULT_ROOT_PADDING;

  const isBlocked = variant === CameraAccessErrorContentVariant.Blocked;
  const isFirefox = isBlocked && props.isFirefox;
  const showChromiumActions = isBlocked && !props.isFirefox;

  const rootTestId =
    variant === CameraAccessErrorContentVariant.Needed
      ? 'qr-camera-access-needed'
      : 'qr-camera-access-blocked';

  const title =
    variant === CameraAccessErrorContentVariant.Needed
      ? t('qrCameraAccessNeededTitle')
      : t('qrCameraAccessBlockedTitle');

  let body: string;
  if (variant === CameraAccessErrorContentVariant.Needed) {
    body = t('qrCameraAccessNeededBody');
  } else {
    body = t('qrCameraAccessBlockedBody');
  }

  const firefoxSteps =
    variant === CameraAccessErrorContentVariant.Blocked && isFirefox
      ? [
          t('qrCameraAccessBlockedFirefoxStep1'),
          t('qrCameraAccessBlockedFirefoxStep2', [props.mozExtensionDisplay]),
          t('qrCameraAccessBlockedFirefoxStep3'),
        ]
      : [];

  const chromiumHintText = showChromiumActions
    ? t('qrCameraAccessBlockedChromiumHint')
    : '';

  const openSettingsLabel = showChromiumActions ? t('openSettings') : '';

  const handleOpenSettings = showChromiumActions
    ? props.onOpenSettings
    : undefined;

  return (
    <Box
      data-testid={rootTestId}
      flexDirection={BoxFlexDirection.Column}
      paddingHorizontal={rootPaddingHorizontal}
      paddingBottom={rootPaddingBottom}
      style={{ width: '100%' }}
    >
      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Center}
        paddingBottom={2}
      >
        <Icon
          name={IconName.Camera}
          color={IconColor.IconDefault}
          size={IconSize.Xl}
        />
      </Box>
      <Box paddingTop={2} paddingBottom={2}>
        <Text
          variant={TextVariant.HeadingMd}
          fontWeight={FontWeight.Medium}
          textAlign={TextAlign.Center}
          color={TextColor.TextDefault}
        >
          {title}
        </Text>
      </Box>
      <Box padding={3}>
        <Text
          variant={TextVariant.BodyMd}
          textAlign={TextAlign.Center}
          color={TextColor.TextDefault}
        >
          {body}
        </Text>
      </Box>
      {isBlocked && isFirefox ? (
        <Box
          data-testid="qr-camera-firefox-instructions"
          flexDirection={BoxFlexDirection.Column}
          gap={2}
          marginTop={2}
          padding={3}
          backgroundColor={BoxBackgroundColor.BackgroundAlternative}
          style={{ borderRadius: 8 }}
        >
          {firefoxSteps.map((step, index) => (
            <Text
              key={`firefox-camera-step-${index}`}
              variant={TextVariant.BodyMd}
              textAlign={TextAlign.Left}
              color={TextColor.TextDefault}
            >
              {`${index + 1}. ${step}`}
            </Text>
          ))}
        </Box>
      ) : null}
      {showChromiumActions ? (
        <Box
          data-testid="qr-camera-chromium-hint"
          flexDirection={BoxFlexDirection.Column}
          marginTop={2}
          padding={3}
          backgroundColor={BoxBackgroundColor.BackgroundAlternative}
          style={{ borderRadius: 8 }}
        >
          <Box
            flexDirection={BoxFlexDirection.Row}
            gap={3}
            alignItems={BoxAlignItems.Center}
          >
            <Box
              data-testid="qr-camera-chromium-hint-videocam"
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Center}
              justifyContent={BoxJustifyContent.Center}
              backgroundColor={BoxBackgroundColor.BackgroundMuted}
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                flexShrink: 0,
              }}
            >
              <Icon
                name={IconName.Videocam}
                color={IconColor.IconDefault}
                size={IconSize.Md}
              />
            </Box>
            <Box style={{ flex: 1, minWidth: 0 }}>
              <Text
                variant={TextVariant.BodyMd}
                textAlign={TextAlign.Left}
                color={TextColor.TextDefault}
              >
                {chromiumHintText}
              </Text>
            </Box>
          </Box>
        </Box>
      ) : null}
      <Box flexDirection={BoxFlexDirection.Column} gap={3} marginTop={4}>
        {showChromiumActions && handleOpenSettings ? (
          <Button
            size={ButtonSize.Lg}
            variant={ButtonVariant.Secondary}
            onClick={handleOpenSettings}
            data-testid="qr-camera-open-settings"
            isFullWidth
          >
            {openSettingsLabel}
          </Button>
        ) : null}
        <Button
          size={ButtonSize.Lg}
          variant={ButtonVariant.Primary}
          onClick={onContinue}
          isLoading={continueLoading}
          isDisabled={continueLoading}
          data-testid={
            variant === CameraAccessErrorContentVariant.Needed
              ? 'qr-camera-access-needed-continue'
              : 'qr-camera-blocked-continue'
          }
          isFullWidth
        >
          {t('continue')}
        </Button>
      </Box>
    </Box>
  );
};

export { CameraAccessErrorContentVariant } from './camera-access-error-content.types';
