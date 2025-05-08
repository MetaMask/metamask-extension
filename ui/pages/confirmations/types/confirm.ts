import { ApprovalControllerState } from '@metamask/approval-controller';
import { DecodingData } from '@metamask/signature-controller';
import { SIWEMessage } from '@metamask/controller-utils';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';

import { SecurityAlertSource } from '../../../../shared/constants/security-provider';

export type TypedSignDataV1Type = {
  name: string;
  value: string;
  type: string;
}[];

export type SecurityAlertResponse = {
  block?: number;
  reason: string;
  features?: string[];
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  result_type: string;
  providerRequestsCount?: Record<string, number>;
  securityAlertId?: string;
  source?: SecurityAlertSource;
};

export type SignatureRequestType = {
  chainId?: string;
  id: string;
  msgParams?: {
    from: string;
    origin: string;
    data: string | TypedSignDataV1Type;
    version?: string;
    requestId?: number;
    signatureMethod?: string;
    siwe?: SIWEMessage;
  };
  type: TransactionType;
  securityAlertResponse?: SecurityAlertResponse;
  decodingLoading?: boolean;
  decodingData?: DecodingData;
};

export type Confirmation = SignatureRequestType | TransactionMeta;

export type ConfirmMetamaskState = {
  metamask: {
    pendingApprovals: ApprovalControllerState['pendingApprovals'];
    approvalFlows: ApprovalControllerState['approvalFlows'];
    signatureSecurityAlertResponses?: Record<string, SecurityAlertResponse>;
  };
};
