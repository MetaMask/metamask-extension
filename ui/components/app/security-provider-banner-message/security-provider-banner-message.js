import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import {
  Color,
  SEVERITIES,
  Size,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { SECURITY_PROVIDER_MESSAGE_SEVERITY } from '../../../../shared/constants/security-provider';
import { I18nContext } from '../../../../.storybook/i18n';
import { BannerAlert, ButtonLink, Text } from '../../component-library';

export default function SecurityProviderBannerMessage({
  securityProviderResponse,
}) {
  const t = useContext(I18nContext);

  let messageTitle;
  let messageText;
  let severity;

  if (
    securityProviderResponse.flagAsDangerous ===
    SECURITY_PROVIDER_MESSAGE_SEVERITY.MALICIOUS
  ) {
    messageTitle =
      securityProviderResponse.reason_header === ''
        ? t('requestFlaggedAsMaliciousFallbackCopyReasonTitle')
        : securityProviderResponse.reason_header;
    messageText =
      securityProviderResponse.reason === ''
        ? t('requestFlaggedAsMaliciousFallbackCopyReason')
        : securityProviderResponse.reason;
    severity = SEVERITIES.DANGER;
  } else if (
    securityProviderResponse.flagAsDangerous ===
    SECURITY_PROVIDER_MESSAGE_SEVERITY.NOT_SAFE
  ) {
    messageTitle = t('requestMayNotBeSafe');
    messageText = t('requestMayNotBeSafeError');
    severity = SEVERITIES.WARNING;
  } else {
    messageTitle = t('requestNotVerified');
    messageText = t('requestNotVerifiedError');
    severity = SEVERITIES.WARNING;
  }

  return (
    <BannerAlert
      className="security-provider-banner-message"
      marginTop={4}
      marginRight={4}
      marginLeft={4}
      title={messageTitle}
      severity={severity}
    >
      <Text variant={TextVariant.bodySm} as="h6">
        {messageText}
      </Text>
      <Text variant={TextVariant.bodySm} as="h6" color={Color.textAlternative}>
        {t('securityAlert', [
          <ButtonLink
            key="opensea_link"
            size={Size.inherit}
            href="https://opensea.io/"
            target="_blank"
          >
            {t('openSeaNew')}
          </ButtonLink>,
          <ButtonLink
            key="blockaid_link"
            size={Size.inherit}
            href="https://blockaid.io/"
            target="_blank"
          >
            {t('blockaid')}
          </ButtonLink>,
        ])}
      </Text>
    </BannerAlert>
  );
}

SecurityProviderBannerMessage.propTypes = {
  securityProviderResponse: PropTypes.object,
};
