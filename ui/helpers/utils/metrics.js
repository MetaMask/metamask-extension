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
const getBlockaidMetricUiCustomization = (resultType) => {
  let uiCustomization;

  if (resultType === BlockaidResultType.Failed) {
    uiCustomization = [MetaMetricsEventUiCustomization.SecurityAlertFailed];
  } else if (resultType === BlockaidResultType.Malicious) {
    uiCustomization = [MetaMetricsEventUiCustomization.FlaggedAsMalicious];
  } else if (resultType === BlockaidResultType.Warning) {
    uiCustomization = [MetaMetricsEventUiCustomization.FlaggedAsWarning];
  }

  return uiCustomization;
};

export const getBlockaidMetricsProps = (transaction) => {
  if (!transaction.securityAlertResponse) {
    return {};
  }

  const params = {};
  const {
    securityAlertResponse: {
      providerRequestsCount,
      reason,
      result_type: resultType,
    },
  } = transaction;

  const uiCustomization = getBlockaidMetricUiCustomization(resultType);
  if (uiCustomization) {
    params.ui_customizations = uiCustomization;
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
