import { TransactionType } from '@metamask/transaction-controller';
import {
  BlockaidReason,
  BlockaidResultType,
} from '../../../shared/constants/security-provider';
import { MetaMetricsEventUiCustomization } from '../../../shared/constants/metametrics';
import { calcTokenAmount } from '../../../shared/lib/transactions-controller-utils';

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

/**
 * Generates a unique identifier utilizing the original request id for signature event fragments
 *
 * @param {number} requestId
 * @returns {string}
 */
export function generateSignatureUniqueId(requestId) {
  return `signature-${requestId}`;
}

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
    source,
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

  params.security_alert_source = source;

  // add counts of each RPC call
  if (providerRequestsCount) {
    Object.keys(providerRequestsCount).forEach((key) => {
      const metricKey = `ppom_${key}_count`;
      params[metricKey] = providerRequestsCount[key];
    });
  }

  return params;
};

export const getSwapAndSendMetricsProps = (transactionMeta) => {
  if (transactionMeta.type !== TransactionType.swapAndSend) {
    return {};
  }

  const {
    chainId,
    sourceTokenAmount,
    sourceTokenDecimals,
    destinationTokenAmount,
    destinationTokenDecimals,
    sourceTokenSymbol,
    destinationTokenAddress,
    destinationTokenSymbol,
    sourceTokenAddress,
  } = transactionMeta;

  const params = {
    chain_id: chainId,
    token_amount_source:
      sourceTokenAmount && sourceTokenDecimals
        ? calcTokenAmount(sourceTokenAmount, sourceTokenDecimals).toString()
        : undefined,
    token_amount_dest_estimate:
      destinationTokenAmount && destinationTokenDecimals
        ? calcTokenAmount(
            destinationTokenAmount,
            destinationTokenDecimals,
          ).toString()
        : undefined,
    token_symbol_source: sourceTokenSymbol,
    token_symbol_destination: destinationTokenSymbol,
    token_address_source: sourceTokenAddress,
    token_address_destination: destinationTokenAddress,
  };

  return params;
};
