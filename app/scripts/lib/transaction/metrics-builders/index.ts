import { merge } from 'lodash';
import { createProjectLogger } from '@metamask/utils';
import type { TransactionMeta } from '@metamask/transaction-controller';
import {
  TransactionMetaMetricsEvent,
  TokenStandard,
} from '../../../../../shared/constants/transaction';
import type {
  TransactionEventPayload,
  TransactionMetricsRequest,
} from '../../../../../shared/types/metametrics';
import { determineTransactionAssetType } from '../../../../../shared/modules/transaction.utils';
import { getAccountMetricsProperties } from './account';
import { getBaseMetricsProperties } from './base';
import { getBatchMetricsProperties } from './batch';
import { getGasMetricsProperties } from './gas';
import { getGaslessMetricsProperties } from './gasless';
import { getHashMetricsProperties } from './hash';
import { getRPCMetricsProperties } from './rpc';
import { getSecurityMetricsProperties } from './security';
import { getSmartTransactionProperties } from './smart-transactions';
import { getSwapBridgeMetricsProperties } from './swap-bridge';
import { getTransactionDetailsMetricsProperties } from './transaction-details';
import { getUICustomizationsMetricsProperties } from './ui-customizations';
import type {
  TransactionMetrics,
  TransactionMetricsBuilder,
  TransactionMetricsBuilderRequest,
} from './types';

const log = createProjectLogger('transaction-metrics-builders');

const EMPTY_METRICS: TransactionMetrics = Object.freeze({
  properties: {},
  sensitiveProperties: {},
});

const METRICS_BUILDERS: TransactionMetricsBuilder[] = [
  getBaseMetricsProperties,
  getGasMetricsProperties,
  getBatchMetricsProperties,
  getHashMetricsProperties,
  getSmartTransactionProperties,
  getSecurityMetricsProperties,
  getRPCMetricsProperties,
  getSwapBridgeMetricsProperties,
  getAccountMetricsProperties,
  getGaslessMetricsProperties,
  getTransactionDetailsMetricsProperties,
  getUICustomizationsMetricsProperties,
];

export async function getBuilderMetrics({
  eventName,
  transactionEventPayload,
  transactionMeta,
  transactionMetricsRequest,
}: {
  eventName: TransactionMetaMetricsEvent;
  transactionEventPayload: TransactionEventPayload;
  transactionMeta: TransactionMeta;
  transactionMetricsRequest: TransactionMetricsRequest;
}): Promise<TransactionMetrics> {
  const context = await buildBuilderContext({
    transactionMeta,
    transactionMetricsRequest,
  });

  const results = await Promise.all(
    METRICS_BUILDERS.map(async (builder) => {
      try {
        return await builder({
          eventName,
          transactionEventPayload,
          transactionMeta,
          transactionMetricsRequest,
          context,
        });
      } catch (error) {
        log('Metrics builder failed', error);
        return EMPTY_METRICS;
      }
    }),
  );

  return results.reduce((acc, current) => merge(acc, current), {
    properties: {},
    sensitiveProperties: {},
  } as TransactionMetrics);
}

async function buildBuilderContext({
  transactionMeta,
  transactionMetricsRequest,
}: {
  transactionMeta: TransactionMeta;
  transactionMetricsRequest: TransactionMetricsRequest;
}): Promise<TransactionMetricsBuilderRequest['context']> {
  const { transactionType, isContractInteraction } =
    determineTransactionTypeAndContractInteraction(
      transactionMeta.type ?? '',
      transactionMeta.originalType,
    );

  let contractMethodName;
  if (transactionMeta.txParams.data) {
    const methodData = await transactionMetricsRequest.getMethodData(
      transactionMeta.txParams.data,
    );
    contractMethodName = methodData?.name;
  }

  const { assetType, tokenStandard } = await determineTransactionAssetType(
    transactionMeta,
    transactionMetricsRequest.provider,
    transactionMetricsRequest.getTokenStandardAndDetails,
  );

  const isApproveMethod =
    contractMethodName === 'Approve' && tokenStandard === TokenStandard.ERC20;

  return {
    contractMethodName,
    contractMethod4Byte: transactionMeta.txParams?.data?.slice(0, 10),
    transactionTypeForMetrics: transactionType,
    isContractInteraction,
    isApproveMethod,
    assetType,
    tokenStandard,
  };
}

const CONTRACT_INTERACTION_TYPES = [
  'bridge',
  'bridgeApproval',
  'contractInteraction',
  'tokenMethodApprove',
  'tokenMethodIncreaseAllowance',
  'tokenMethodSafeTransferFrom',
  'tokenMethodSetApprovalForAll',
  'tokenMethodTransfer',
  'tokenMethodTransferFrom',
  'swap',
  'swapAndSend',
  'swapApproval',
];

function determineTransactionTypeAndContractInteraction(
  type: string,
  originalType?: string,
): {
  transactionType: string;
  isContractInteraction: boolean;
} {
  const isContractInteraction = CONTRACT_INTERACTION_TYPES.includes(type);

  const directTypeMappings = [
    'swapAndSend',
    'cancel',
    'deployContract',
    'gasPayment',
    'batch',
    'shieldSubscriptionApprove',
  ];

  if (directTypeMappings.includes(type)) {
    return {
      transactionType: type,
      isContractInteraction,
    };
  }

  if (type === 'retry' && originalType) {
    return {
      transactionType: originalType,
      isContractInteraction,
    };
  }

  if (isContractInteraction) {
    if (type === 'swap') {
      return {
        transactionType: 'mm_swap',
        isContractInteraction: true,
      };
    }
    if (type === 'bridge') {
      return {
        transactionType: 'mm_bridge',
        isContractInteraction: true,
      };
    }
    return {
      transactionType: 'contractInteraction',
      isContractInteraction: true,
    };
  }

  return {
    transactionType: 'simpleSend',
    isContractInteraction: false,
  };
}
