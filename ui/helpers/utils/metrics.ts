/* eslint-disable @typescript-eslint/naming-convention */
import { TransactionType } from '@metamask/transaction-controller';
import {
  BlockaidReason,
  BlockaidResultType,
} from '../../../shared/constants/security-provider';
import { MetaMetricsEventUiCustomization } from '../../../shared/constants/metametrics';
import { calcTokenAmount } from '../../../shared/lib/transactions-controller-utils';

type BlockaidSecurityAlertResponse = {
  'result_type'?: BlockaidResultType | null;
  reason?: string | null;
  description?: string;
  source?: string;
  providerRequestsCount?: Record<string, number>;
  features?: unknown[];
};

type SwapAndSendTransactionMeta = {
  type?: string;
  chainId?: string | number;
  sourceTokenAmount?: string;
  sourceTokenDecimals?: number;
  destinationTokenAmount?: string;
  destinationTokenDecimals?: number;
  sourceTokenSymbol?: string;
  destinationTokenAddress?: string;
  destinationTokenSymbol?: string;
  sourceTokenAddress?: string;
};

export function getMethodName(camelCase: unknown): string {
  if (!camelCase || typeof camelCase !== 'string') {
    return '';
  }

  return camelCase
    .replace(/([a-z])([A-Z])/gu, '$1 $2')
    .replace(/([A-Z])([a-z])/gu, ' $1$2')
    .replace(/ +/gu, ' ');
}

export function formatAccountType(accountType: string): string {
  if (accountType === 'default') {
    return 'metamask';
  }

  return accountType;
}

/**
 * Generates a unique identifier utilizing the original request id for signature event fragments
 *
 * @param requestId
 */
export function generateSignatureUniqueId(requestId: number): string {
  return `signature-${requestId}`;
}

/**
 * Returns the ui_customization string value based on the result type
 *
 * @param resultType
 */
const getBlockaidMetricUiCustomization = (
  resultType?: BlockaidResultType | null,
): MetaMetricsEventUiCustomization[] | undefined => {
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

export const getBlockaidMetricsProps = ({
  securityAlertResponse,
}: {
  securityAlertResponse?: BlockaidSecurityAlertResponse;
}): Record<string, unknown> => {
  if (!securityAlertResponse) {
    return {};
  }

  const params: Record<string, unknown> = {};
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

export const getSwapAndSendMetricsProps = (
  transactionMeta: SwapAndSendTransactionMeta,
): Record<string, unknown> => {
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
    'chain_id': chainId,
    'token_amount_source':
      sourceTokenAmount && sourceTokenDecimals
        ? calcTokenAmount(sourceTokenAmount, sourceTokenDecimals).toString()
        : undefined,
    'token_amount_dest_estimate':
      destinationTokenAmount && destinationTokenDecimals
        ? calcTokenAmount(
            destinationTokenAmount,
            destinationTokenDecimals,
          ).toString()
        : undefined,
    'token_symbol_source': sourceTokenSymbol,
    'token_symbol_destination': destinationTokenSymbol,
    'token_address_source': sourceTokenAddress,
    'token_address_destination': destinationTokenAddress,
  };

  return params;
};
