import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  BannerAlert,
  BannerAlertSeverity,
  Box,
  Text,
  TextButton,
  TextButtonSize,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import {
  SERVICE_INTERRUPTION_CONFIG,
  SUPPORT_CONFIG,
} from '../../../../../shared/constants/perps';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { getIsPerpsServiceInterruptionBannerEnabled } from '../../../../selectors/perps/feature-flags';

export type PerpsServiceInterruptionBannerProps = {
  testId?: string;
};

/**
 * LaunchDarkly-gated banner shown during a Perps outage.
 *
 * Returns null while the flag is off so callers can mount it unconditionally
 * without reserving space. Place it outside content that can fail to load
 * (for example above an error boundary) so the message stays visible.
 *
 * @param options0 - Component props.
 * @param options0.testId - Test id for the banner root.
 * @returns The outage banner, or null when the flag is disabled.
 */
export const PerpsServiceInterruptionBanner = ({
  testId = 'perps-service-interruption-banner',
}: PerpsServiceInterruptionBannerProps) => {
  const isEnabled = useSelector(getIsPerpsServiceInterruptionBannerEnabled);
  const t = useI18nContext();

  const handleFaqPress = useCallback(() => {
    globalThis.platform.openTab({ url: SERVICE_INTERRUPTION_CONFIG.FaqUrl });
  }, []);

  const handleSupportPress = useCallback(() => {
    globalThis.platform.openTab({ url: SUPPORT_CONFIG.Url });
  }, []);

  if (!isEnabled) {
    return null;
  }

  const faqLink = (
    <TextButton
      key="faq"
      size={TextButtonSize.BodySm}
      className="inline underline"
      onClick={handleFaqPress}
      data-testid={`${testId}-faq-link`}
    >
      {t('perpsServiceInterruptionFaqLink')}
    </TextButton>
  );
  const supportLink = (
    <TextButton
      key="support"
      size={TextButtonSize.BodySm}
      className="inline underline"
      onClick={handleSupportPress}
      data-testid={`${testId}-support-link`}
    >
      {t('perpsServiceInterruptionContactSupport')}
    </TextButton>
  );

  return (
    <Box className="px-4 pt-4" data-testid={testId}>
      <BannerAlert
        severity={BannerAlertSeverity.Warning}
        title={t('perpsServiceInterruptionTitle')}
      >
        <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
          {t('perpsServiceInterruptionDescription', [faqLink, supportLink])}
        </Text>
      </BannerAlert>
    </Box>
  );
};
