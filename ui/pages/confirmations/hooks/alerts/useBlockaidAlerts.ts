import BlockaidPackage from '@blockaid/ppom_release/package.json';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { NETWORK_TO_NAME_MAP } from '../../../../../shared/constants/network';
import {
  BlockaidResultType,
  FALSE_POSITIVE_REPORT_BASE_URL,
  SECURITY_PROVIDER_UTM_SOURCE,
} from '../../../../../shared/constants/security-provider';
import { Alert } from '../../../../ducks/confirm-alerts/confirm-alerts';
import ZENDESK_URLS from '../../../../helpers/constants/zendesk-url';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { SIGNATURE_TRANSACTION_TYPES } from '../../utils';
import { isCorrectDeveloperTransactionType } from '../../../../../shared/lib/confirmation.utils';
import {
  SecurityAlertResponse,
  SignatureRequestType,
} from '../../types/confirm';
import { useConfirmContext } from '../../context/confirm';
import useCurrentSignatureSecurityAlertResponse from '../useCurrentSignatureSecurityAlertResponse';
import { normalizeProviderAlert } from './utils';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const zlib = require('zlib');

/**
 * Maximum length of the generated report URL. Web servers commonly reject
 * URLs in the 8k character range with "414 URI Too Long", so the report URL
 * is kept comfortably below that.
 */
export const MAX_REPORT_URL_LENGTH = 4096;

/** Marker appended to report fields that were truncated to bound the URL. */
export const REPORT_FIELD_TRUNCATION_MARKER = '...[truncated]';

/**
 * Report fields that contain unbounded, free-form data and may be truncated
 * to keep the report URL within {@link MAX_REPORT_URL_LENGTH}. Identifying
 * metadata (chain, domain, classification, etc.) is never truncated.
 */
const SHRINKABLE_REPORT_FIELDS = ['jsonRpcParams', 'reproduce'] as const;

const encodeReportUrl = (stringifiedReportData: string): string => {
  const encodedData =
    zlib?.gzipSync?.(stringifiedReportData) ?? stringifiedReportData;

  return `${FALSE_POSITIVE_REPORT_BASE_URL}?data=${encodeURIComponent(
    encodedData.toString('base64'),
  )}&utm_source=${SECURITY_PROVIDER_UTM_SOURCE}`;
};

const truncateReportField = (value: string): string => {
  const nextLength = Math.floor(value.length / 2);

  if (nextLength <= REPORT_FIELD_TRUNCATION_MARKER.length) {
    return REPORT_FIELD_TRUNCATION_MARKER;
  }

  return `${value.slice(0, nextLength)}${REPORT_FIELD_TRUNCATION_MARKER}`;
};

/**
 * Builds the false positive report URL, truncating oversized free-form fields
 * (e.g. the full transaction params of a Seaport order) as needed so that the
 * URL stays within practical length limits and is not rejected by the report
 * portal with "414 URI Too Long".
 *
 * @param stringifiedReportData - The stringified report data to encode.
 * @returns The report URL, bounded to {@link MAX_REPORT_URL_LENGTH}.
 */
export const getReportUrl = (stringifiedReportData: string): string => {
  let reportUrl = encodeReportUrl(stringifiedReportData);

  if (reportUrl.length <= MAX_REPORT_URL_LENGTH) {
    return reportUrl;
  }

  const reportData: Record<string, unknown> = JSON.parse(stringifiedReportData);

  while (reportUrl.length > MAX_REPORT_URL_LENGTH) {
    const field = SHRINKABLE_REPORT_FIELDS.find(
      (key) =>
        typeof reportData[key] === 'string' &&
        (reportData[key] as string).length >
          REPORT_FIELD_TRUNCATION_MARKER.length,
    );

    if (!field) {
      break;
    }

    reportData[field] = truncateReportField(reportData[field] as string);
    reportUrl = encodeReportUrl(JSON.stringify(reportData));
  }

  return reportUrl;
};

export const ALERT_RESULT_TYPES = [
  BlockaidResultType.Malicious,
  BlockaidResultType.Warning,
  BlockaidResultType.Errored,
] as BlockaidResultType[];

type SecurityAlertResponsesState = {
  metamask: {
    signatureSecurityAlertResponses: Record<string, SecurityAlertResponse>;
    transactions: TransactionMeta[];
  };
};

const useBlockaidAlerts = (): Alert[] => {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext();

  const securityAlertId = (
    currentConfirmation?.securityAlertResponse as SecurityAlertResponse
  )?.securityAlertId as string;

  const transactionType = currentConfirmation?.type as TransactionType;

  const signatureSecurityAlertResponse =
    useCurrentSignatureSecurityAlertResponse();

  const transactionSecurityAlertResponse = useSelector(
    (state: SecurityAlertResponsesState) =>
      state.metamask.transactions.find(
        (transaction) =>
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (transaction.securityAlertResponse as any)?.securityAlertId ===
          securityAlertId,
      )?.securityAlertResponse,
  );

  const securityAlertResponse =
    signatureSecurityAlertResponse || transactionSecurityAlertResponse;

  const isTransactionTypeSupported =
    isCorrectDeveloperTransactionType(transactionType) ||
    SIGNATURE_TRANSACTION_TYPES.includes(transactionType);

  const shouldShowAlert = ALERT_RESULT_TYPES.includes(
    securityAlertResponse?.result_type as BlockaidResultType,
  );

  let stringifiedJSONData: string | undefined;

  if (securityAlertResponse && currentConfirmation) {
    const {
      block,
      features,
      reason,
      result_type: resultType,
    } = securityAlertResponse as SecurityAlertResponse;
    const { chainId, msgParams, origin, type, txParams } =
      currentConfirmation as SignatureRequestType & TransactionMeta;

    const isFailedResultType = resultType === BlockaidResultType.Errored;

    const reportData = {
      blockNumber: block,
      blockaidVersion: BlockaidPackage.version,
      chain: (NETWORK_TO_NAME_MAP as Record<string, string>)[chainId],
      classification: isFailedResultType ? 'error' : reason,
      domain: origin ?? msgParams?.origin ?? origin,
      jsonRpcMethod: type,
      jsonRpcParams: JSON.stringify(txParams ?? msgParams),
      resultType: isFailedResultType ? BlockaidResultType.Errored : resultType,
      reproduce: JSON.stringify(features),
    };

    stringifiedJSONData = JSON.stringify(reportData);
  }

  return useMemo<Alert[]>(() => {
    if (
      !isTransactionTypeSupported ||
      !shouldShowAlert ||
      !securityAlertResponse
    ) {
      return [];
    }

    let reportUrl: string = ZENDESK_URLS.SUPPORT_URL;
    if (stringifiedJSONData) {
      reportUrl = getReportUrl(stringifiedJSONData);
    }

    return [normalizeProviderAlert(securityAlertResponse, t, reportUrl)];
  }, [
    isTransactionTypeSupported,
    shouldShowAlert,
    securityAlertResponse,
    stringifiedJSONData,
    t,
  ]);
};

export default useBlockaidAlerts;
