import { ApprovalRequest } from '@metamask/approval-controller';
import { ApprovalType } from '@metamask/controller-utils';
import { Json } from '@metamask/utils';

const SignatureApprovalTypes = [
  ApprovalType.EthSign,
  ApprovalType.PersonalSign,
  ApprovalType.EthSignTypedData,
];

export const isSignatureApprovalRequest = (
  request: ApprovalRequest<Record<string, Json>>,
) => SignatureApprovalTypes.includes(request.type as ApprovalType);
