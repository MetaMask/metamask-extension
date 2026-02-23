/* eslint-disable @typescript-eslint/naming-convention */
import { MetaMetricsEventUiCustomization } from '../../../../../shared/constants/metametrics';
import {
  createCacheKey,
  mapChainIdToSupportedEVMChain,
  ResultType,
} from '../../../../../shared/lib/trust-signals';
// eslint-disable-next-line import/no-restricted-paths
import { getBlockaidMetricsProps } from '../../../../../ui/helpers/utils/metrics';
import type { TransactionMetricsBuilder } from './types';

export const getSecurityMetricsProperties: TransactionMetricsBuilder = ({
  transactionMeta,
  transactionMetricsRequest,
}) => {
  const uiCustomizations = [];

  if (transactionMeta.securityProviderResponse?.flagAsDangerous === 1) {
    uiCustomizations.push(MetaMetricsEventUiCustomization.FlaggedAsMalicious);
  } else if (transactionMeta.securityProviderResponse?.flagAsDangerous === 2) {
    uiCustomizations.push(
      MetaMetricsEventUiCustomization.FlaggedAsSafetyUnknown,
    );
  }

  const blockaidProperties = getBlockaidMetricsProps(transactionMeta) as {
    ui_customizations?: string[];
    [key: string]: unknown;
  };

  if (blockaidProperties?.ui_customizations?.length) {
    uiCustomizations.push(...blockaidProperties.ui_customizations);
  }

  if (transactionMeta.simulationFails) {
    uiCustomizations.push(MetaMetricsEventUiCustomization.GasEstimationFailed);
  }

  let addressAlertResponse: ResultType | 'not_applicable' = 'not_applicable';
  const securityAlertsEnabled =
    transactionMetricsRequest.getSecurityAlertsEnabled();
  if (securityAlertsEnabled) {
    const { to } = transactionMeta.txParams;
    if (typeof to === 'string') {
      const supportedEVMChain = mapChainIdToSupportedEVMChain(
        transactionMeta.chainId,
      );
      if (supportedEVMChain) {
        const cacheKey = createCacheKey(supportedEVMChain, to);
        const cachedResponse =
          transactionMetricsRequest.getAddressSecurityAlertResponse(cacheKey);
        addressAlertResponse = cachedResponse
          ? cachedResponse.result_type
          : ResultType.Loading;
      }
    }
  }

  return {
    properties: {
      gas_estimation_failed: Boolean(transactionMeta.simulationFails),
      ...blockaidProperties,
      ui_customizations: uiCustomizations.length > 0 ? uiCustomizations : null,
      address_alert_response: addressAlertResponse,
    },
    sensitiveProperties: {},
  };
};
