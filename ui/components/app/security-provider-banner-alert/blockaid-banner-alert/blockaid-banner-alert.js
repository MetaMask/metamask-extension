import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { captureException } from '@sentry/browser';

import { Text } from '../../../component-library';
import { Severity } from '../../../../helpers/constants/design-system';
import { I18nContext } from '../../../../contexts/i18n';

import {
  BlockaidResultType,
  SecurityProvider,
} from '../../../../../shared/constants/security-provider';
import SecurityProviderBannerAlert from '../security-provider-banner-alert';

/** Reason to description translation key mapping grouped by translations. Grouped by translations. */
const REASON_TO_DESCRIPTION_TKEY = Object.freeze({
  approval_farming: 'blockaidDescriptionApproveFarming',
  permit_farming: 'blockaidDescriptionApproveFarming',
  set_approval_for_all: 'blockaidDescriptionApproveFarming',

  blur_farming: 'blockaidDescriptionBlurFarming',

  seaport_farming: 'blockaidDescriptionSeaportFarming',

  malicious_domain: 'blockaidDescriptionMaliciousDomain',

  signature_farming: 'blockaidDescriptionMightLoseAssets',
  trade_order_farming: 'blockaidDescriptionMightLoseAssets',
  unfair_trade: 'blockaidDescriptionMightLoseAssets',

  raw_native_token_transfer: 'blockaidDescriptionTransferFarming',
  transfer_farming: 'blockaidDescriptionTransferFarming',
  transfer_from_farming: 'blockaidDescriptionTransferFarming',

  other: 'blockaidDescriptionMightLoseAssets',
});

/** List of suspicious reason(s). Other reasons will be deemed as deceptive. */
const SUSPCIOUS_REASON = ['signature_farming'];

function BlockaidBannerAlert({
  ppomResponse: { reason, resultType, features },
}) {
  const t = useContext(I18nContext);

  if (resultType === BlockaidResultType.Benign) {
    return null;
  }

  if (!REASON_TO_DESCRIPTION_TKEY[reason]) {
    captureException(`BlockaidBannerAlert: Unidentified reason '${reason}'`);
  }

  const description = t(REASON_TO_DESCRIPTION_TKEY[reason] || 'other');

  const details = Boolean(features?.length) && (
    <Text as="ul">
      {features.map((feature, i) => (
        <li key={`blockaid-detail-${i}`}>• {feature}</li>
      ))}
    </Text>
  );

  const severity =
    resultType === BlockaidResultType.Malicious
      ? Severity.Danger
      : Severity.Warning;

  const title =
    SUSPCIOUS_REASON.indexOf(reason) > -1
      ? t('blockaidTitleSuspicious')
      : t('blockaidTitleDeceptive');

  return (
    <SecurityProviderBannerAlert
      description={description}
      details={details}
      provider={SecurityProvider.Blockaid}
      severity={severity}
      title={title}
    />
  );
}

BlockaidBannerAlert.propTypes = {
  ppomResponse: PropTypes.object,
};

export default BlockaidBannerAlert;
