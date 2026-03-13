/**
 * List of approval types that use templated confirmations.
 * Extracted to break circular dependency: selectors → templates → actions → selectors.
 * Only imports from constants - no store/actions or selectors.
 */
import { ApprovalType } from '@metamask/controller-utils';
import {
  HYPERLIQUID_APPROVAL_TYPE,
  ASTERDEX_APPROVAL_TYPE,
  GMX_APPROVAL_TYPE,
  SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES,
  SMART_TRANSACTION_CONFIRMATION_TYPES,
} from '../../../../../shared/constants/app';

export const TEMPLATED_CONFIRMATION_APPROVAL_TYPES = [
  ApprovalType.SwitchEthereumChain,
  ApprovalType.ResultSuccess,
  ApprovalType.ResultError,
  SMART_TRANSACTION_CONFIRMATION_TYPES.showSmartTransactionStatusPage,
  ApprovalType.SnapDialogAlert,
  ApprovalType.SnapDialogConfirmation,
  ApprovalType.SnapDialogPrompt,
  ApprovalType.SnapDialogDefault,
  SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountCreation,
  SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountRemoval,
  SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.showSnapAccountRedirect,
  HYPERLIQUID_APPROVAL_TYPE,
  ASTERDEX_APPROVAL_TYPE,
  GMX_APPROVAL_TYPE,
];
