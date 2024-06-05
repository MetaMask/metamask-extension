import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { captureException } from '@sentry/browser';
import BlockaidPackage from '@blockaid/ppom_release/package.json';

import { useSelector } from 'react-redux';
import { NETWORK_TO_NAME_MAP } from '../../../../../../shared/constants/network';
import { OverflowWrap } from '../../../../../helpers/constants/design-system';
import { I18nContext } from '../../../../../contexts/i18n';
import {
  BlockaidReason,
  BlockaidResultType,
  SecurityProvider,
} from '../../../../../../shared/constants/security-provider';
import {
  BannerAlertSeverity,
  Text,
} from '../../../../../components/component-library';
import { useTransactionEventFragment } from '../../../hooks/useTransactionEventFragment';

import SecurityProviderBannerAlert from '../security-provider-banner-alert';
import LoadingIndicator from '../../../../../components/ui/loading-indicator';
import { getCurrentChainId } from '../../../../../selectors';
import { getReportUrl } from './blockaid-banner-utils';

const zlib = require('zlib');

/** Reason to description translation key mapping. Grouped by translations. */
export const REASON_TO_DESCRIPTION_TKEY = Object.freeze({
  [BlockaidReason.approvalFarming]: 'blockaidDescriptionApproveFarming',
  [BlockaidReason.permitFarming]: 'blockaidDescriptionApproveFarming',
  [BlockaidReason.setApprovalForAll]: 'blockaidDescriptionApproveFarming',

  [BlockaidReason.blurFarming]: 'blockaidDescriptionBlurFarming',

  [BlockaidReason.errored]: 'blockaidDescriptionErrored', // TODO: change in i8n

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
export const REASON_TO_TITLE_TKEY = Object.freeze({
  [BlockaidReason.errored]: 'blockaidTitleMayNotBeSafe',
  [BlockaidReason.rawSignatureFarming]: 'blockaidTitleSuspicious',
});

function BlockaidBannerAlert({ txData, ...props }) {
  const { securityAlertResponse, origin, msgParams, type, txParams, chainId } =
    txData;

  const selectorChainId = useSelector(getCurrentChainId);

  const t = useContext(I18nContext);
  const { updateTransactionEventFragment } = useTransactionEventFragment();

  if (
    !securityAlertResponse ||
    Object.keys(securityAlertResponse).length === 0
  ) {
    return null;
  } else if (securityAlertResponse.result_type === BlockaidResultType.Loading) {
    return (
      <LoadingIndicator
        isLoading
        style={{ position: 'relative', flex: '0 0 auto', margin: '8px auto 0' }}
      />
    );
  }

  const {
    block,
    features,
    reason,
    result_type: resultType,
  } = securityAlertResponse;

  let title, description;
  if (resultType === BlockaidResultType.Benign) {
    return null;
  } else if (resultType === BlockaidResultType.Warning) {
    // When `result_type` is `Warning`, the `reason` is no longer relevant for
    // determining the copy. This is because Blockaid has lower certainty when
    // they flag something as warning so that requires a softer and broader
    // message than the ones we use when `result_type` is `Malicious` or
    // `Error`.

    title = t(REASON_TO_TITLE_TKEY[BlockaidReason.errored]);
    description = t('blockaidDescriptionWarning');
  } else {
    if (!REASON_TO_DESCRIPTION_TKEY[reason]) {
      captureException(`BlockaidBannerAlert: Unidentified reason '${reason}'`);
    }

    title = t(REASON_TO_TITLE_TKEY[reason] || 'blockaidTitleDeceptive');
    description = t(
      REASON_TO_DESCRIPTION_TKEY[reason] || REASON_TO_DESCRIPTION_TKEY.other,
    );
  }

  const details = features?.length ? (
    <Text as="ul" overflowWrap={OverflowWrap.BreakWord}>
      {features.map((feature, i) => (
        <li key={`blockaid-detail-${i}`}>• {feature}</li>
      ))}
    </Text>
  ) : null;

  const isFailedResultType = resultType === BlockaidResultType.Errored;

  // On the banner colors:
  // Malicious -> red
  // Error and Warning -> orange
  const severity =
    resultType === BlockaidResultType.Malicious
      ? BannerAlertSeverity.Danger
      : BannerAlertSeverity.Warning;

  /** Data we pass to Blockaid false reporting portal. As far as I know, there are no documents that exist that specifies these key values */
  const reportUrl = (() => {
    const reportData = {
      blockNumber: block,
      blockaidVersion: BlockaidPackage.version,
      chain: NETWORK_TO_NAME_MAP[chainId ?? selectorChainId],
      classification: isFailedResultType ? 'error' : reason,
      domain: origin ?? msgParams?.origin ?? txParams?.origin,
      jsonRpcMethod: type,
      jsonRpcParams: JSON.stringify(txParams ?? msgParams),
      resultType: isFailedResultType ? BlockaidResultType.Errored : resultType,
      reproduce: JSON.stringify(features),
    };

    const jsonData = JSON.stringify(reportData);

    const encodedData = zlib?.gzipSync?.(jsonData) ?? jsonData;

    return getReportUrl(encodedData);
  })();

  const onClickSupportLink = () => {
    updateTransactionEventFragment(
      {
        properties: {
          external_link_clicked: 'security_alert_support_link',
        },
      },
      txData.id,
    );
  };

  return (
    <SecurityProviderBannerAlert
      description={description}
      details={details}
      provider={SecurityProvider.Blockaid}
      reportUrl={reportUrl}
      severity={severity}
      title={title}
      onClickSupportLink={onClickSupportLink}
      {...props}
    />
  );
}

BlockaidBannerAlert.propTypes = {
  txData: PropTypes.object,
};

export default BlockaidBannerAlert;
