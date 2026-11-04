import React from 'react';
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
import { SERVICE_INTERRUPTION_CONFIG } from '../../../../../shared/constants/perps';
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

  if (!isEnabled) {
    return null;
  }

  const faqLink = (
    <TextButton
      key="faq"
      asChild
      size={TextButtonSize.BodySm}
      className="inline underline"
    >
      <a
        href={SERVICE_INTERRUPTION_CONFIG.FaqUrl}
        target="_blank"
        rel="noopener noreferrer"
        data-testid={`${testId}-faq-link`}
      >
        {t('perpsServiceInterruptionFaqLink')}
      </a>
    </TextButton>
  );
  const supportLink = (
    <TextButton
      key="support"
      asChild
      size={TextButtonSize.BodySm}
      className="inline underline"
    >
      <a
        href={SERVICE_INTERRUPTION_CONFIG.SupportUrl}
        target="_blank"
        rel="noopener noreferrer"
        data-testid={`${testId}-support-link`}
      >
        {t('perpsServiceInterruptionContactSupport')}
      </a>
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
