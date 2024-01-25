///: BEGIN:ONLY_INCLUDE_IF(blockaid)
import {
  BlockaidReason,
  BlockaidResultType,
} from '../../../shared/constants/security-provider';
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
export const getBlockaidMetricsParams = (securityAlertResponse = null) => {
  const additionalParams = {};

  if (securityAlertResponse) {
    const {
      externalLinkClicked,
      result_type: resultType,
      reason,
      providerRequestsCount,
    } = securityAlertResponse;

    if (externalLinkClicked) {
      additionalParams.external_link_clicked = externalLinkClicked;
    }

    if (resultType === BlockaidResultType.Failed) {
      additionalParams.ui_customizations = ['security_alert_failed'];
      return additionalParams;
    }

    if (resultType === BlockaidResultType.Malicious) {
      additionalParams.ui_customizations = ['flagged_as_malicious'];
    } else if (resultType !== BlockaidResultType.Benign) {
      additionalParams.security_alert_reason = BlockaidReason.notApplicable;
    }

    additionalParams.security_alert_response =
      resultType ?? BlockaidResultType.NotApplicable;
    additionalParams.security_alert_reason =
      reason ?? securityAlertResponse?.reason ?? BlockaidReason.notApplicable;

    // add counts of each RPC call
    if (providerRequestsCount) {
      Object.keys(providerRequestsCount).forEach((key) => {
        const metricKey = `ppom_${key}_count`;
        additionalParams[metricKey] = providerRequestsCount[key];
      });
    }
  }

  return additionalParams;
};
///: END:ONLY_INCLUDE_IF
