import { ApprovalControllerState } from '@metamask/approval-controller';
import {
  SimulationData,
  TransactionType,
} from '@metamask/transaction-controller';

export type TypedSignDataV1Type = {
  name: string;
  value: string;
  type: string;
}[];

export type SecurityAlertResponse = {
  reason: string;
  features?: string[];
  result_type: string;
  providerRequestsCount?: Record<string, number>;
  securityAlertId?: string;
};

export type SignatureRequestType = {
  chainId?: string;
  id: string;
  msgParams?: {
    from: string;
    origin: string;
    data: string | TypedSignDataV1Type;
    version?: string;
  };
  type: TransactionType;
  custodyId?: string;
  securityAlertResponse?: SecurityAlertResponse;
};

export type TransactionRequestType = {
  chainId?: string;
  actionId: number;
  id: string;
  txParams?: {
    data: string;
    from: string;
    gas: string;
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
    to: string;
    value: string;
  };
  type: TransactionType;
  custodyId?: string;
  securityAlertResponse?: SecurityAlertResponse;
  origin: string;
  simulationData: SimulationData;
};

export type Confirmation = SignatureRequestType | TransactionRequestType;

export type ConfirmMetamaskState = {
  confirm: {
    currentConfirmation?: Confirmation;
    isScrollToBottomNeeded?: boolean;
  };
  metamask: {
    pendingApprovals: ApprovalControllerState['pendingApprovals'];
    approvalFlows: ApprovalControllerState['approvalFlows'];
  };
};
