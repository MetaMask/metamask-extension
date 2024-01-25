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
export const getBlockaidMetricsParams = (securityAlertResponse) => {
  if (!securityAlertResponse) {
    return {};
  }

  const params = {};
  const {
    result_type: resultType,
    reason,
    providerRequestsCount,
  } = securityAlertResponse;

  if (resultType === BlockaidResultType.Failed) {
    params.ui_customizations = ['security_alert_failed'];
  } else if (resultType === BlockaidResultType.Malicious) {
    params.ui_customizations = ['flagged_as_malicious'];
  } else if (resultType !== BlockaidResultType.Benign) {
    params.security_alert_reason = BlockaidReason.notApplicable;
  }

  params.security_alert_response =
    resultType ?? BlockaidResultType.NotApplicable;
  params.security_alert_reason =
    reason ?? securityAlertResponse?.reason ?? BlockaidReason.notApplicable;

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
