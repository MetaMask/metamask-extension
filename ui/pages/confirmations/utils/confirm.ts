import { ApprovalRequest } from '@metamask/approval-controller';
import { ApprovalType } from '@metamask/controller-utils';
import { TransactionType } from '@metamask/transaction-controller';
import { Json } from '@metamask/utils';

export const RedesignApprovalTypes = [
  ApprovalType.PersonalSign,
  ApprovalType.EthSignTypedData,
] as const;

export const RedesignTransactionTypes = [
  TransactionType.contractInteraction,
] as const;

const SignatureApprovalTypes = [
  ApprovalType.EthSign,
  ApprovalType.PersonalSign,
  ApprovalType.EthSignTypedData,
];

export const isSignatureApprovalRequest = (
  request: ApprovalRequest<Record<string, Json>>,
) => SignatureApprovalTypes.includes(request.type as ApprovalType);
