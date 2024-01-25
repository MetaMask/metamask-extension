///: BEGIN:ONLY_INCLUDE_IF(blockaid)
import {
  BlockaidReason,
  BlockaidResultType,
} from '../../../shared/constants/security-provider';
import { MetaMetricsEventUiCustomization } from '../../../shared/constants/metametrics';
///: END:ONLY_INCLUDE_IF

export function getMethodName(camelCase) {
  if (!camelCase || typeof camelCase !== 'string') {
    return '';
  }

  return camelCase
    .replace(/([a-z])([A-Z])/gu, '$1 $2')
    .replace(/([A-Z])([a-z])/gu, ' $1$2')
    .replace(/ +/gu, ' ');
}

export function formatAccountType(accountType) {
  if (accountType === 'default') {
    return 'metamask';
  }

  return accountType;
}

///: BEGIN:ONLY_INCLUDE_IF(blockaid)
export const getBlockaidMetricsProps = (transaction) => {
  if (!transaction.securityAlertResponse) {
    return {};
  }

  const params = {};
  const {
    externalLinkClicked,
    securityAlertResponse: {
      providerRequestsCount,
      reason,
      result_type: resultType,
    },
  } = transaction;

  if (externalLinkClicked) {
    params.external_link_clicked = externalLinkClicked;
  }

  if (resultType === BlockaidResultType.Failed) {
    params.ui_customizations = [
      MetaMetricsEventUiCustomization.SecurityAlertFailed,
    ];
  } else if (resultType === BlockaidResultType.Malicious) {
    params.ui_customizations = [
      MetaMetricsEventUiCustomization.FlaggedAsMalicious,
    ];
  }

  if (resultType !== BlockaidResultType.Benign) {
    params.security_alert_reason = reason ?? BlockaidReason.notApplicable;
  }
  params.security_alert_response =
    resultType ?? BlockaidResultType.NotApplicable;

  // add counts of each RPC call
  if (providerRequestsCount) {
    Object.keys(providerRequestsCount).forEach((key) => {
      const metricKey = `ppom_${key}_count`;
      params[metricKey] = providerRequestsCount[key];
    });
  }

  return params;
};
///: END:ONLY_INCLUDE_IF
