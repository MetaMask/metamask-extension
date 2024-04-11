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
/**
 * Returns the ui_customization string value based on the result type
 *
 * @param {BlockaidResultType} resultType
 * @returns {MetaMetricsEventUiCustomization}
 */
const getBlockaidMetricUiCustomization = (resultType) => {
  let uiCustomization;

  if (resultType === BlockaidResultType.Malicious) {
    uiCustomization = [MetaMetricsEventUiCustomization.FlaggedAsMalicious];
  } else if (resultType === BlockaidResultType.Warning) {
    uiCustomization = [MetaMetricsEventUiCustomization.FlaggedAsWarning];
  } else if (resultType === BlockaidResultType.Errored) {
    uiCustomization = [MetaMetricsEventUiCustomization.SecurityAlertError];
  }

  return uiCustomization;
};

/**
 * @param {import('@metamask/transaction-controller').TransactionMeta} transactionMeta
 * @returns {object}
 */
export const getBlockaidMetricsProps = ({ securityAlertResponse }) => {
  if (!securityAlertResponse) {
    return {};
  }

  const params = {};
  const {
    providerRequestsCount,
    reason,
    result_type: resultType,
    description,
  } = securityAlertResponse;

  const uiCustomization = getBlockaidMetricUiCustomization(resultType);
  if (uiCustomization) {
    params.ui_customizations = uiCustomization;
  }

  if (resultType !== BlockaidResultType.Benign) {
    params.security_alert_reason = reason ?? BlockaidReason.notApplicable;
  }

  if (description) {
    params.security_alert_description = description;
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

/**
 * Returns the properties object for smart transaction metrics.
 *
 * @param {import('../../../app/scripts/lib/transaction/metrics.ts').TransactionMetricsRequest} transactionMetricsRequest
 * @param {import('@metamask/transaction-controller').TransactionMeta} transactionMeta
 * @returns {import('../../../app/scripts/lib/transaction/metrics.ts').SmartTransactionMetricsProperties}
 */
export const getSmartTransactionMetricsProperties = (
  transactionMetricsRequest,
  transactionMeta,
) => {
  const isSmartTransaction = transactionMetricsRequest.getIsSmartTransaction();
  const properties = {
    is_smart_transaction: isSmartTransaction,
  };
  if (!isSmartTransaction) {
    return properties;
  }
  const smartTransaction =
    transactionMetricsRequest.getSmartTransactionByMinedTxHash(
      transactionMeta.hash,
    );
  const smartTransactionStatusMetadata = smartTransaction?.statusMetadata;
  if (!smartTransactionStatusMetadata) {
    return properties;
  }
  properties.smart_transaction_duplicated =
    smartTransactionStatusMetadata.duplicated;
  properties.smart_transaction_timed_out =
    smartTransactionStatusMetadata.timedOut;
  properties.smart_transaction_proxied = smartTransactionStatusMetadata.proxied;
  return properties;
};
