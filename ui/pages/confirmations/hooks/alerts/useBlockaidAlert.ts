import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import BlockaidPackage from '@blockaid/ppom_release/package.json';

import {
  BlockaidResultType,
  FALSE_POSITIVE_REPORT_BASE_URL,
  SECURITY_PROVIDER_UTM_SOURCE,
} from '../../../../../shared/constants/security-provider';
import ZENDESK_URLS from '../../../../helpers/constants/zendesk-url';
import { NETWORK_TO_NAME_MAP } from '../../../../../shared/constants/network';
import { Alert } from '../../../../ducks/confirm-alerts/confirm-alerts';
import { getCurrentChainId } from '../../../../selectors';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { SecurityAlertResponse } from '../../types/confirm';
import { isSignatureTransactionType } from '../../utils';
import useCurrentConfirmation from '../useCurrentConfirmation';
import { normalizeProviderAlert } from './utils';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const zlib = require('zlib');

type SignatureSecurityAlertResponsesState = {
  metamask: {
    signatureSecurityAlertResponses: Record<string, SecurityAlertResponse>;
  };
};

const useBlockaidAlerts = (): Alert[] => {
  const { currentConfirmation } = useCurrentConfirmation();
  const t = useI18nContext();
  const securityAlertResponse =
    currentConfirmation?.securityAlertResponse as SecurityAlertResponse;

  const selectorChainId = useSelector(getCurrentChainId);

  const signatureSecurityAlertResponse = useSelector(
    (state: SignatureSecurityAlertResponsesState) =>
      state.metamask.signatureSecurityAlertResponses?.[
        securityAlertResponse?.securityAlertId as string
      ],
  );

  let stringifiedJSONData: string | undefined;

  if (signatureSecurityAlertResponse && currentConfirmation) {
    const {
      block,
      features,
      reason,
      result_type: resultType,
    } = signatureSecurityAlertResponse as SecurityAlertResponse;
    const { chainId, msgParams, origin, type, txParams } = currentConfirmation;

    const isFailedResultType = resultType === BlockaidResultType.Errored;

    const reportData = {
      blockNumber: block,
      blockaidVersion: BlockaidPackage.version,
      chain: (NETWORK_TO_NAME_MAP as Record<string, string>)[
        chainId ?? selectorChainId
      ],
      classification: isFailedResultType ? 'error' : reason,
      domain:
        origin ??
        (msgParams as { origin: string })?.origin ??
        (txParams as { origin: string })?.origin,
      jsonRpcMethod: type,
      jsonRpcParams: JSON.stringify(txParams ?? msgParams),
      resultType: isFailedResultType ? BlockaidResultType.Errored : resultType,
      reproduce: JSON.stringify(features),
    };

    stringifiedJSONData = JSON.stringify(reportData);
  }

  const alerts = useMemo<Alert[]>(() => {
    if (!isSignatureTransactionType(currentConfirmation)) {
      return [];
    }

    if (
      !signatureSecurityAlertResponse ||
      [BlockaidResultType.Benign, BlockaidResultType.Loading].includes(
        signatureSecurityAlertResponse?.result_type as BlockaidResultType,
      )
    ) {
      return [];
    }

    let reportUrl = ZENDESK_URLS.SUPPORT_URL;
    if (stringifiedJSONData) {
      const encodedData =
        zlib?.gzipSync?.(stringifiedJSONData) ?? stringifiedJSONData;

      reportUrl = `${FALSE_POSITIVE_REPORT_BASE_URL}?data=${encodeURIComponent(
        encodedData.toString('base64'),
      )}&utm_source=${SECURITY_PROVIDER_UTM_SOURCE}`;
    }

    return [
      normalizeProviderAlert(signatureSecurityAlertResponse, t, reportUrl),
    ];
  }, [currentConfirmation, signatureSecurityAlertResponse]);

  return alerts;
};

export default useBlockaidAlerts;
