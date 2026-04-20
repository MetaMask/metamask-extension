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

type TranslateFn = ReturnType<typeof useI18nContext>;

type FirefoxInstructionStep = {
  id: string;
  order: number;
  text: string;
};

/**
 * Resolves root test id, title, and body copy for the camera access variant.
 *
 * @param variant - Needed vs blocked UI branch.
 * @param t - i18n `t` from `useI18nContext`.
 * @returns Root `data-testid` plus localized title and body.
 */
function resolveCameraAccessCopy(
  variant: CameraAccessErrorContentVariant,
  t: TranslateFn,
): { rootTestId: string; title: string; body: string } {
  const isNeeded = variant === CameraAccessErrorContentVariant.Needed;
  return {
    rootTestId: isNeeded
      ? 'qr-camera-access-needed'
      : 'qr-camera-access-blocked',
    title: isNeeded
      ? t('qrCameraAccessNeededTitle')
      : t('qrCameraAccessBlockedTitle'),
    body: isNeeded
      ? t('qrCameraAccessNeededBody')
      : t('qrCameraAccessBlockedBody'),
  };
}

/**
 * Builds numbered Firefox permission instructions with stable row ids for list keys.
 *
 * @param t - i18n `t` from `useI18nContext`.
 * @param mozExtensionDisplay - Extension origin string shown in Firefox step 2.
 * @returns Rows for `renderFirefoxCameraInstructions` (`id`, `order`, `text`).
 */
function buildFirefoxInstructionSteps(
  t: TranslateFn,
  mozExtensionDisplay: string,
): FirefoxInstructionStep[] {
  return [
    {
      id: 'qr-camera-firefox-step-permissions',
      order: 1,
      text: t('qrCameraAccessBlockedFirefoxStep1'),
    },
    {
      id: 'qr-camera-firefox-step-extension-url',
      order: 2,
      text: t('qrCameraAccessBlockedFirefoxStep2', [mozExtensionDisplay]),
    },
    {
      id: 'qr-camera-firefox-step-reload',
      order: 3,
      text: t('qrCameraAccessBlockedFirefoxStep3'),
    },
  ];
}

/**
 * Returns the `data-testid` for the primary continue button by variant.
 *
 * @param variant - Needed vs blocked UI branch.
 * @returns Continue button `data-testid` string.
 */
function continueButtonTestId(
  variant: CameraAccessErrorContentVariant,
): string {
  return variant === CameraAccessErrorContentVariant.Needed
    ? 'qr-camera-access-needed-continue'
    : 'qr-camera-blocked-continue';
}

/**
 * Renders the Firefox blocked-state numbered instruction list.
 *
 * @param params - List props.
 * @param params.steps - Instruction rows (`id`, `order`, `text`).
 */
function renderFirefoxCameraInstructions(params: {
  steps: readonly FirefoxInstructionStep[];
}) {
  const { steps } = params;
  return (
    <Box
      data-testid="qr-camera-firefox-instructions"
      flexDirection={BoxFlexDirection.Column}
      gap={2}
      marginTop={2}
      padding={3}
      backgroundColor={BoxBackgroundColor.BackgroundAlternative}
      style={{ borderRadius: 8 }}
    >
      {steps.map((step) => (
        <Text
          key={step.id}
          variant={TextVariant.BodyMd}
          textAlign={TextAlign.Left}
          color={TextColor.TextDefault}
        >
          {`${step.order}. ${step.text}`}
        </Text>
      ))}
    </Box>
  );
}

/**
 * Renders the Chromium blocked-state hint callout with videocam icon.
 *
 * @param params - Hint props.
 * @param params.hintText - Localized Chromium blocked-state hint body.
 */
function renderChromiumCameraHint(params: { hintText: string }) {
  const { hintText } = params;
  return (
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
            {hintText}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}

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

  const { rootTestId, title, body } = resolveCameraAccessCopy(variant, t);

  const firefoxSteps =
    isBlocked && isFirefox
      ? buildFirefoxInstructionSteps(t, props.mozExtensionDisplay)
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
      {firefoxSteps.length > 0
        ? renderFirefoxCameraInstructions({ steps: firefoxSteps })
        : null}
      {showChromiumActions
        ? renderChromiumCameraHint({ hintText: chromiumHintText })
        : null}
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
          data-testid={continueButtonTestId(variant)}
          isFullWidth
        >
          {t('continue')}
        </Button>
      </Box>
    </Box>
  );
};

export { CameraAccessErrorContentVariant } from './camera-access-error-content.types';
