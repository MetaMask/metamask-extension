import { ApprovalType } from '@metamask/controller-utils';
import {
  HYPERLIQUID_APPROVAL_TYPE,
  ASTERDEX_APPROVAL_TYPE,
  GMX_APPROVAL_TYPE,
  SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES,
  SMART_TRANSACTION_CONFIRMATION_TYPES,
} from '../../../../../shared/constants/app';
import smartTransactionStatusPage from './smart-transaction-status-page';
import createSnapAccount from './create-snap-account';
import removeSnapAccount from './remove-snap-account';
import snapAccountRedirect from './snap-account-redirect';
import switchEthereumChain from './switch-ethereum-chain';
import success from './success';
import error from './error';
import snapAlert from './snaps/snap-alert/snap-alert';
import snapConfirmation from './snaps/snap-confirmation/snap-confirmation';
import snapPrompt from './snaps/snap-prompt/snap-prompt';
import snapDefault from './snaps/snap-default/snap-default';
import defiReferralConsent from './defi-referral-consent';

// Source of truth for the templated approval types. Keys are mirrored as
// `TEMPLATED_CONFIRMATION_APPROVAL_TYPES` in `./approval-types.ts`, with
// parity enforced at compile time there. `as const` is required so
// `keyof typeof APPROVAL_TEMPLATES` resolves to the literal-key union the
// parity guard pins to.
export const APPROVAL_TEMPLATES = {
  [ApprovalType.SwitchEthereumChain]: switchEthereumChain,
  // Use ApprovalType from utils controller
  [ApprovalType.ResultSuccess]: success,
  [ApprovalType.ResultError]: error,
  [SMART_TRANSACTION_CONFIRMATION_TYPES.showSmartTransactionStatusPage]:
    smartTransactionStatusPage,
  [ApprovalType.SnapDialogAlert]: snapAlert,
  [ApprovalType.SnapDialogConfirmation]: snapConfirmation,
  [ApprovalType.SnapDialogPrompt]: snapPrompt,
  [ApprovalType.SnapDialogDefault]: snapDefault,
  [SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountCreation]:
    createSnapAccount,
  [SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountRemoval]:
    removeSnapAccount,
  [SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.showSnapAccountRedirect]:
    snapAccountRedirect,
  [HYPERLIQUID_APPROVAL_TYPE]: defiReferralConsent,
  [ASTERDEX_APPROVAL_TYPE]: defiReferralConsent,
  [GMX_APPROVAL_TYPE]: defiReferralConsent,
} as const;
