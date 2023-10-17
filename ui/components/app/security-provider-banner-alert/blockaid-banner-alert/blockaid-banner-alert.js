import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { captureException } from '@sentry/browser';

import { Text } from '../../../component-library';
import {
  OverflowWrap,
  Severity,
} from '../../../../helpers/constants/design-system';
import { I18nContext } from '../../../../contexts/i18n';

import {
  BlockaidReason,
  BlockaidResultType,
  SecurityProvider,
} from '../../../../../shared/constants/security-provider';
import SecurityProviderBannerAlert from '../security-provider-banner-alert';

/** Reason to description translation key mapping. Grouped by translations. */
const REASON_TO_DESCRIPTION_TKEY = Object.freeze({
  [BlockaidReason.approvalFarming]: 'blockaidDescriptionApproveFarming',
  [BlockaidReason.permitFarming]: 'blockaidDescriptionApproveFarming',
  [BlockaidReason.setApprovalForAll]: 'blockaidDescriptionApproveFarming',

  [BlockaidReason.blurFarming]: 'blockaidDescriptionBlurFarming',

  [BlockaidReason.failed]: 'blockaidDescriptionFailed',

  [BlockaidReason.seaportFarming]: 'blockaidDescriptionSeaportFarming',

  [BlockaidReason.maliciousDomain]: 'blockaidDescriptionMaliciousDomain',

  [BlockaidReason.rawSignatureFarming]: 'blockaidDescriptionMightLoseAssets',
  [BlockaidReason.tradeOrderFarming]: 'blockaidDescriptionMightLoseAssets',

  [BlockaidReason.rawNativeTokenTransfer]: 'blockaidDescriptionTransferFarming',
  [BlockaidReason.transferFarming]: 'blockaidDescriptionTransferFarming',
  [BlockaidReason.transferFromFarming]: 'blockaidDescriptionTransferFarming',

  [BlockaidReason.other]: 'blockaidDescriptionMightLoseAssets',
});

/** Reason to title translation key mapping. */
const REASON_TO_TITLE_TKEY = Object.freeze({
  [BlockaidReason.failed]: 'blockaidTitleMayNotBeSafe',
  [BlockaidReason.rawSignatureFarming]: 'blockaidTitleSuspicious',
});

function BlockaidBannerAlert({ securityAlertResponse, ...props }) {
  const t = useContext(I18nContext);

  if (!securityAlertResponse) {
    return null;
  }

  const { reason, result_type: resultType, features } = securityAlertResponse;

  if (resultType === BlockaidResultType.Benign) {
    return null;
  }

  if (!REASON_TO_DESCRIPTION_TKEY[reason]) {
    captureException(`BlockaidBannerAlert: Unidentified reason '${reason}'`);
  }

  const description = t(REASON_TO_DESCRIPTION_TKEY[reason] || 'other');

  const details = features?.length ? (
    <Text as="ul" overflowWrap={OverflowWrap.BreakWord}>
      {features.map((feature, i) => (
        <li key={`blockaid-detail-${i}`}>• {feature}</li>
      ))}
    </Text>
  ) : null;

  const isFailedResultType = resultType === BlockaidResultType.Failed;

  const severity =
    resultType === BlockaidResultType.Malicious
      ? Severity.Danger
      : Severity.Warning;

  const title = t(REASON_TO_TITLE_TKEY[reason] || 'blockaidTitleDeceptive');

  return (
    <SecurityProviderBannerAlert
      description={description}
      details={details}
      provider={isFailedResultType ? null : SecurityProvider.Blockaid}
      severity={severity}
      title={title}
      {...props}
    />
  );
}

BlockaidBannerAlert.propTypes = {
  securityAlertResponse: PropTypes.object,
};

export default BlockaidBannerAlert;
