import {
  TransactionType,
  TransactionStatus,
} from '../../../shared/constants/transaction';

export const PENDING_STATUS_HASH = {
  [TransactionStatus.unapproved]: true,
  [TransactionStatus.approved]: true,
  [TransactionStatus.submitted]: true,
  [TransactionStatus.pending]: true,
};

export const PRIORITY_STATUS_HASH = {
  ...PENDING_STATUS_HASH,
  [TransactionStatus.confirmed]: true,
};

export const TOKEN_CATEGORY_HASH = {
  [TransactionType.tokenMethodApprove]: true,
  [TransactionType.tokenMethodSetApprovalForAll]: true,
  [TransactionType.tokenMethodTransfer]: true,
  [TransactionType.tokenMethodTransferFrom]: true,
};
