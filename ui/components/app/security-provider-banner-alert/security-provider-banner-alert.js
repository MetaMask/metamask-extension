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
import {
  AlignItems,
  Color,
  Severity,
  Size,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { I18nContext } from '../../../../.storybook/i18n';

import Disclosure from '../../ui/disclosure';
import { DisclosureVariant } from '../../ui/disclosure/disclosure.constants';
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
}) {
  const t = useContext(I18nContext);

  return (
    <BannerAlert
      title={title}
      severity={severity}
      marginTop={4}
      marginRight={4}
      marginLeft={4}
    >
      <Text variant={TextVariant.bodySm} as="h6" marginTop={2}>
        {description}
      </Text>

      {details && (
        <Disclosure title={t('seeDetails')} type={DisclosureVariant.Arrow}>
          {details}
        </Disclosure>
      )}

      <Text
        as="h6"
        marginTop={2}
        alignItems={AlignItems.center}
        color={Color.textAlternative}
        variant={TextVariant.bodySm}
      >
        <Icon
          className="disclosure__summary--icon"
          color={Color.primaryDefault}
          name={IconName.SecurityTick}
          size={IconSize.Sm}
          marginInlineEnd={1}
        />
        {t('securityProviderAdviceBy', [
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
    </BannerAlert>
  );
}

SecurityProviderBannerAlert.propTypes = {
  description: PropTypes.oneOfType([PropTypes.string, PropTypes.element])
    .isRequired,
  provider: PropTypes.oneOfType(Object.values(SecurityProvider)).isRequired,
  severity: PropTypes.oneOfType([Severity.Danger, Severity.Warning]).isRequired,
  title: PropTypes.string.isRequired,

  //  Optional
  details: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
};

export default SecurityProviderBannerAlert;
