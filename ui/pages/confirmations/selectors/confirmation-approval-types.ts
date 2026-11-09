import { ApprovalType } from '@metamask/controller-utils';

// Approval types eligible for the confirmation screen's ID-less route.
export const CONFIRMATION_APPROVAL_TYPES: readonly string[] = [
  ApprovalType.PersonalSign,
  ApprovalType.EthSignTypedData,
  ApprovalType.Transaction,
];
