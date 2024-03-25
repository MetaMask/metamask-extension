import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import {
  BannerAlert,
  ButtonLink,
  Text,
} from '../../../../components/component-library';
import Disclosure from '../../../../components/ui/disclosure';
import { DisclosureVariant } from '../../../../components/ui/disclosure/disclosure.constants';

import { I18nContext } from '../../../../contexts/i18n';
import {
  Display,
  Severity,
  Size,
} from '../../../../helpers/constants/design-system';

import { SecurityProvider } from '../../../../../shared/constants/security-provider';
import ZENDESK_URLS from '../../../../helpers/constants/zendesk-url';

function SecurityProviderBannerAlert({
  description,
  details,
  onClickSupportLink,
  provider,
  severity,
  title,
  reportUrl,
  ...props
}) {
  const t = useContext(I18nContext);

  return (
    <BannerAlert
      data-testid="security-provider-banner-alert"
      title={title}
      severity={severity}
      {...props}
    >
      <Text marginTop={2}>{description}</Text>

      <Disclosure title={t('seeDetails')} variant={DisclosureVariant.Arrow}>
        {details}
        <Text marginTop={3} display={Display.Flex}>
          {t('somethingDoesntLookRight', [
            <ButtonLink
              key={`security-provider-button-supporturl-${provider}`}
              size={Size.inherit}
              href={reportUrl || ZENDESK_URLS.SUPPORT_URL}
              externalLink
              onClick={onClickSupportLink}
            >
              {t('reportIssue')}
            </ButtonLink>,
          ])}
        </Text>
      </Disclosure>
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

  /** Function to be called when the support link is clicked */
  onClickSupportLink: PropTypes.func,

  /** URL to open when report an issue link is clicked */
  reportUrl: PropTypes.string,
};

export default SecurityProviderBannerAlert;
