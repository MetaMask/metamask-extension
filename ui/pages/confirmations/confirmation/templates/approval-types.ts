import { ApprovalType } from '@metamask/controller-utils';
import {
  HYPERLIQUID_APPROVAL_TYPE,
  ASTERDEX_APPROVAL_TYPE,
  GMX_APPROVAL_TYPE,
  SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES,
  SMART_TRANSACTION_CONFIRMATION_TYPES,
} from '../../../../../shared/constants/app';
import type { IsEquivalent } from '../../../../../shared/types/type-level-utils';
import type { Expect } from '../../../../../shared/types/type-test-utils';
import type * as Templates from './approval-templates';

// Manual mirror of the keys of `APPROVAL_TEMPLATES` in `./approval-templates.ts`
// (source of truth). Mirrored rather than derived so shared-layer consumers
// (e.g. `ui/selectors/selectors.js`) can read this list without transitively
// pulling in template implementations, which import from `ui/store/actions`
// and would close a cycle. Parity is enforced at compile time by the
// assertion below — see its comment block before editing.
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
] as const;

// ──────────────────────────────────────────────────────────────────────────
// Compile-time parity guard — DO NOT REMOVE OR WEAKEN.
//
// A TypeScript error on `AssertApprovalTypesMatchTemplates` means the array
// above and the keys of `APPROVAL_TEMPLATES` have drifted. **Fix the data,
// not the assertion.** Without this guard nothing else checks that the two
// lists stay in sync (see the leading comment for why they're duplicated);
// removing it, swapping `IsEquivalent` for a one-sided check, or
// `// @ts-ignore`-ing the error silently re-opens that drift.
//
// To fix:
//   – New key in `APPROVAL_TEMPLATES` → add the matching string to the array.
//   – New entry in the array → add the matching key+template to `APPROVAL_TEMPLATES`.
//   – Key/entry removed → remove it from the other side.
// ──────────────────────────────────────────────────────────────────────────
type AssertApprovalTypesMatchTemplates = [
  Expect<
    IsEquivalent<
      keyof typeof Templates.APPROVAL_TEMPLATES,
      (typeof TEMPLATED_CONFIRMATION_APPROVAL_TYPES)[number]
    >
  >,
];
