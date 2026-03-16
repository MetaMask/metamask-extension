import type {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import type { Json } from '@metamask/utils';
import type {
  TransactionApprovalAmountType,
  TransactionMetaMetricsEvent,
} from '../../../../../shared/constants/transaction';
import type {
  TransactionEventPayload,
  TransactionMetricsRequest,
} from '../../../../../shared/types/metametrics';

export type MetricsProperties = Record<string, Json | undefined>;

export type TransactionMetrics = {
  properties: MetricsProperties;
  sensitiveProperties: MetricsProperties;
};

export type TransactionMetricsBuilderRequest = {
  eventName: TransactionMetaMetricsEvent;
  transactionEventPayload: TransactionEventPayload;
  transactionMeta: TransactionMeta;
  transactionMetricsRequest: TransactionMetricsRequest;
  context: {
    contractMethodName?: string;
    contractMethod4Byte?: string;
    transactionTypeForMetrics: TransactionType | string;
    isContractInteraction: boolean;
    isApproveMethod: boolean;
    assetType?: string;
    tokenStandard?: string;
    transactionApprovalAmountType?: TransactionApprovalAmountType;
  };
};

export type TransactionMetricsBuilder = (
  request: TransactionMetricsBuilderRequest,
) => Promise<TransactionMetrics> | TransactionMetrics;
