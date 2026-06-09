import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
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
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import ZENDESK_URLS from '../../../../helpers/constants/zendesk-url';
import type { QrErrorContentProps } from './qr-error-content.types';
import { resolveErrorCopy, rootTestId } from './qr-error-content.utils';

/**
 * Presentational component for QR scan and decode error states.
 *
 * Renders localized title and body copy based on `errorType` and
 * `flowContext`, plus "Learn more" and "Try again" action buttons.
 *
 * @param options0 - Component props.
 * @param options0.errorType - Which scan error occurred.
 * @param options0.flowContext - Whether the scan is for pairing or signing.
 * @param options0.onTryAgain - Called when the user taps "Try again".
 */
export const QrErrorContent = ({
  errorType,
  flowContext,
  onTryAgain,
}: QrErrorContentProps) => {
  const t = useI18nContext();
  const { title, body } = resolveErrorCopy(errorType, flowContext, t);

  const handleLearnMore = () => {
    globalThis.platform.openTab({ url: ZENDESK_URLS.HARDWARE_QR_WALLETS });
  };

  return (
    <Box
      data-testid={rootTestId(errorType, flowContext)}
      flexDirection={BoxFlexDirection.Column}
      paddingHorizontal={4}
      paddingBottom={4}
      style={{ width: '100%' }}
    >
      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Center}
        paddingBottom={2}
      >
        <Icon
          name={IconName.Danger}
          color={IconColor.WarningDefault}
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
          color={TextColor.TextAlternative}
        >
          {body}
        </Text>
      </Box>
      <Box flexDirection={BoxFlexDirection.Column} gap={3} marginTop={4}>
        <Button
          size={ButtonSize.Lg}
          variant={ButtonVariant.Secondary}
          onClick={handleLearnMore}
          data-testid="qr-error-learn-more"
          isFullWidth
        >
          {t('learnMoreUpperCase')}
        </Button>
        <Button
          size={ButtonSize.Lg}
          variant={ButtonVariant.Primary}
          onClick={onTryAgain}
          data-testid="qr-error-try-again"
          isFullWidth
        >
          {t('continue')}
        </Button>
      </Box>
    </Box>
  );
};
