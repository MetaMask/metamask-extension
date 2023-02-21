import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import {
  Color,
  SEVERITIES,
  Size,
  TypographyVariant,
} from '../../../helpers/constants/design-system';
import { I18nContext } from '../../../../.storybook/i18n';
import { BannerAlert, ButtonLink } from '../../component-library';
import Typography from '../../ui/typography/typography';
import { SECURITY_PROVIDER_MESSAGE_SEVERITIES } from './security-provider-banner-message.constants';

export default function SecurityProviderBannerMessage({
  securityProviderResponse,
}) {
  const t = useContext(I18nContext);

  let messageTitle;
  let messageText;
  let severity;

  if (
    securityProviderResponse.flagAsDangerous ===
    SECURITY_PROVIDER_MESSAGE_SEVERITIES.MALICIOUS
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
    SECURITY_PROVIDER_MESSAGE_SEVERITIES.NOT_SAFE
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
      marginTop={4}
      marginRight={4}
      marginLeft={4}
      title={messageTitle}
      severity={severity}
    >
      <Typography variant={TypographyVariant.H6}>{messageText}</Typography>
      <Typography variant={TypographyVariant.H7} color={Color.textAlternative}>
        {t('thisIsBasedOn')}
        <ButtonLink
          size={Size.inherit}
          href="https://opensea.io/"
          target="_blank"
        >
          {t('openSeaNew')}
        </ButtonLink>
      </Typography>
    </BannerAlert>
  );
}

SecurityProviderBannerMessage.propTypes = {
  securityProviderResponse: PropTypes.object,
};
