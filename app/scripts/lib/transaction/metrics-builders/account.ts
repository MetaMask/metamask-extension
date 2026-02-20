/* eslint-disable @typescript-eslint/naming-convention */
import { getSnapAndHardwareInfoForMetrics } from '../../snap-keyring/metrics';
import type { TransactionMetricsBuilder } from './types';

export const getAccountMetricsProperties: TransactionMetricsBuilder = async ({
  transactionMetricsRequest,
}) => {
  let accountType;
  try {
    accountType = await transactionMetricsRequest.getAccountType(
      transactionMetricsRequest.getSelectedAddress(),
    );
  } catch (error) {
    accountType = 'error';
  }

  const snapAndHardwareInfo = await getSnapAndHardwareInfoForMetrics(
    transactionMetricsRequest.getAccountType,
    transactionMetricsRequest.getDeviceModel,
    transactionMetricsRequest.getHardwareTypeForMetric,
    transactionMetricsRequest.snapAndHardwareMessenger,
  );

  return {
    properties: {
      account_type: accountType,
      device_model: await transactionMetricsRequest.getDeviceModel(
        transactionMetricsRequest.getSelectedAddress(),
      ),
      ...snapAndHardwareInfo,
      hd_entropy_index: transactionMetricsRequest.getHDEntropyIndex(),
    },
    sensitiveProperties: {},
  };
};
