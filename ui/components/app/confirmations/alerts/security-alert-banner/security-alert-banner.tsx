import React from 'react';
import {
  BannerAlert,
  Box,
  ButtonLink,
  ButtonLinkSize,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../../component-library';
import Disclosure from '../../../../ui/disclosure';
import { DisclosureVariant } from '../../../../ui/disclosure/disclosure.constants';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  AlignItems,
  Display,
  IconColor,
  Severity,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import {
  SecurityProvider,
  SECURITY_PROVIDER_CONFIG,
} from '../../../../../../shared/constants/security-provider';
import ZENDESK_URLS from '../../../../../helpers/constants/zendesk-url';
import { getBannerAlertSeverity } from '../utils';

export type SecurityAlertBannerProps = {
  description: string;
  details?: React.ReactNode | string[];
  onClickSupportLink?: () => void;
  provider?: SecurityProvider;
  reportUrl?: string;
  severity: Severity.Danger | Severity.Info | Severity.Warning;
  title: string;
};

function AlertProvider({ provider }: { provider?: SecurityProvider }) {
  const t = useI18nContext();

  if (!provider) {
    return null;
  }

  return (
    <Text
      marginTop={1}
      display={Display.Flex}
      alignItems={AlignItems.center}
      color={TextColor.textAlternative}
      variant={TextVariant.bodySm}
    >
      <Icon
        className="disclosure__summary--icon"
        color={IconColor.primaryDefault}
        name={IconName.SecurityTick}
        size={IconSize.Sm}
        marginInlineEnd={1}
      />
      {t('securityProviderPoweredBy', [
        <ButtonLink
          key={`security-provider-button-link-${provider}`}
          size={ButtonLinkSize.Inherit}
          href={SECURITY_PROVIDER_CONFIG[provider]?.url}
          externalLink
        >
          {t(SECURITY_PROVIDER_CONFIG[provider]?.tKeyName)}
        </ButtonLink>,
      ])}
    </Text>
  );
}

function ReportLink({
  reportUrl,
  provider,
  onClickSupportLink,
}: {
  reportUrl?: string;
  provider?: SecurityProvider;
  onClickSupportLink?: () => void;
}) {
  const t = useI18nContext();
  return (
    <Text marginTop={1} display={Display.Flex}>
      {t('somethingDoesntLookRight', [
        <ButtonLink
          key={`security-provider-button-supporturl-${provider}`}
          size={ButtonLinkSize.Inherit}
          href={reportUrl ?? ZENDESK_URLS.SUPPORT_URL}
          externalLink
          onClick={onClickSupportLink}
        >
          {t('reportIssue')}
        </ButtonLink>,
      ])}
    </Text>
  );
}

function AlertDetails({
  details,
  reportUrl,
  onClickSupportLink,
  provider,
}: {
  details?: React.ReactNode | string[];
  reportUrl?: string;
  onClickSupportLink?: () => void;
  provider?: SecurityProvider;
}) {
  const t = useI18nContext();
  if (!details) {
    return null;
  }

  return (
    <Box marginTop={1}>
      <Disclosure title={t('seeDetails')} variant={DisclosureVariant.Arrow}>
        {details instanceof Array ? (
          <Box as="ul" className={'alert-modal__alert-details'} paddingLeft={6}>
            {details.map((detail, index) => (
              <Box as="li" key={`disclosure-detail-${index}`}>
                <Text variant={TextVariant.bodySm}>{detail}</Text>
              </Box>
            ))}
          </Box>
        ) : (
          details
        )}
        <ReportLink
          reportUrl={reportUrl}
          provider={provider}
          onClickSupportLink={onClickSupportLink}
        />
      </Disclosure>
    </Box>
  );
}

function SecurityAlertBanner({
  description,
  details,
  onClickSupportLink,
  provider,
  severity,
  title,
  reportUrl,
  ...props
}: SecurityAlertBannerProps) {
  return (
    <BannerAlert
      data-testid="security-banner-alert"
      title={title}
      severity={getBannerAlertSeverity(severity)}
      description={description}
      {...props}
    >
      <AlertDetails
        details={details}
        reportUrl={reportUrl}
        onClickSupportLink={onClickSupportLink}
        provider={provider}
      />
      <AlertProvider provider={provider} />
    </BannerAlert>
  );
}

export default SecurityAlertBanner;
