import { ApprovalType } from '@metamask/controller-utils';
import {
  HYPERLIQUID_APPROVAL_TYPE,
  ASTERDEX_APPROVAL_TYPE,
  GMX_APPROVAL_TYPE,
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES,
  ///: END:ONLY_INCLUDE_IF
  SMART_TRANSACTION_CONFIRMATION_TYPES,
} from '../../../../../shared/constants/app';

/**
 * Approval types that use the templated confirmation flow.
 * Kept in sync with APPROVAL_TEMPLATES keys in ./index.js via dev assertion.
 */
export const TEMPLATED_CONFIRMATION_APPROVAL_TYPES: string[] = [
  ApprovalType.SwitchEthereumChain,
  ApprovalType.ResultSuccess,
  ApprovalType.ResultError,
  SMART_TRANSACTION_CONFIRMATION_TYPES.showSmartTransactionStatusPage,
  ApprovalType.SnapDialogAlert,
  ApprovalType.SnapDialogConfirmation,
  ApprovalType.SnapDialogPrompt,
  ApprovalType.SnapDialogDefault,
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountCreation,
  SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountRemoval,
  SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.showSnapAccountRedirect,
  ///: END:ONLY_INCLUDE_IF
  HYPERLIQUID_APPROVAL_TYPE,
  ASTERDEX_APPROVAL_TYPE,
  GMX_APPROVAL_TYPE,
];
