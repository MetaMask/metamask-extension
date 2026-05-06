import { ApprovalType } from '@metamask/controller-utils';
import {
  HYPERLIQUID_APPROVAL_TYPE,
  ASTERDEX_APPROVAL_TYPE,
  GMX_APPROVAL_TYPE,
  SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES,
  SMART_TRANSACTION_CONFIRMATION_TYPES,
} from '../../../../../shared/constants/app';

// Extracted from `./index.js` so consumers (e.g. `ui/selectors/selectors.js`)
// can read the list without transitively pulling in template implementations
// — which import from `ui/store/actions` and would otherwise close a cycle.
// Keep this list in sync with the keys of `APPROVAL_TEMPLATES` in `./index.js`.
export const TEMPLATED_CONFIRMATION_APPROVAL_TYPES: string[] = [
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
