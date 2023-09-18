import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import {
  BannerAlert,
  ButtonLink,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../component-library';
import Disclosure from '../../ui/disclosure';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { DisclosureVariant } from '../../ui/disclosure/disclosure.constants';
import { getURLHostName } from '../../../helpers/utils/util';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';

import { I18nContext } from '../../../contexts/i18n';
import {
  AlignItems,
  Color,
  Display,
  IconColor,
  Severity,
  Size,
  TextVariant,
} from '../../../helpers/constants/design-system';

import {
  SecurityProvider,
  SECURITY_PROVIDER_CONFIG,
} from '../../../../shared/constants/security-provider';

function SecurityProviderBannerAlert({
  description,
  details,
  provider,
  severity,
  title,
  ...props
}) {
  const t = useContext(I18nContext);
  const trackEvent = useContext(MetaMetricsContext);

  const contactUsEventClicked = () => {
    trackEvent({
      category: MetaMetricsEventCategory.Transactions,
      event: MetaMetricsEventName.ExternalLinkClicked,
      properties: {
        external_link_clicked: getURLHostName(
          SECURITY_PROVIDER_CONFIG[provider].supportUrl,
        ),
      },
    });
  };

  return (
    <BannerAlert
      data-testid="security-provider-banner-alert"
      title={title}
      severity={severity}
      {...props}
    >
      <Text marginTop={2}>{description}</Text>

      {details && (
        <Disclosure title={t('seeDetails')} variant={DisclosureVariant.Arrow}>
          {details}
        </Disclosure>
      )}

      {provider && (
        <>
          <Text
            marginTop={3}
            display={Display.Flex}
            alignItems={AlignItems.center}
            color={Color.textAlternative}
            variant={TextVariant.bodySm}
          >
            {t('somethingDoesntLookRight', [
              <ButtonLink
                key={`security-provider-button-supporturl-${provider}`}
                size={Size.inherit}
                href={SECURITY_PROVIDER_CONFIG[provider].supportUrl}
                externalLink
                onClick={contactUsEventClicked}
              >
                {t('contactUs')}
              </ButtonLink>,
            ])}
          </Text>

          <Text
            marginTop={3}
            display={Display.Flex}
            alignItems={AlignItems.center}
            color={Color.textAlternative}
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
                size={Size.inherit}
                href={SECURITY_PROVIDER_CONFIG[provider].url}
                externalLink
              >
                {t(SECURITY_PROVIDER_CONFIG[provider].tKeyName)}
              </ButtonLink>,
            ])}
          </Text>
        </>
      )}
    </BannerAlert>
  );
}

SecurityProviderBannerAlert.propTypes = {
  /** Description content that may be plain text or contain hyperlinks */
  description: PropTypes.oneOfType([PropTypes.string, PropTypes.element])
    .isRequired,

  /** Severity level */
  severity: PropTypes.oneOf([Severity.Danger, Severity.Warning]).isRequired,

  /** Title to be passed as <BannerAlert> param */
  title: PropTypes.string.isRequired,

  /**
   * Optional
   */

  /** Additional details to be displayed under the description */
  details: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),

  /** Name of the security provider */
  provider: PropTypes.oneOf(Object.values(SecurityProvider)),
};

export default SecurityProviderBannerAlert;
