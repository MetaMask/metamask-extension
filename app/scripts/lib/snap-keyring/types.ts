import { RestrictedControllerMessenger } from '@metamask/base-controller';
import { MaybeUpdateState, TestOrigin } from '@metamask/phishing-controller';
import type { KeyringControllerGetAccountsAction } from '@metamask/keyring-controller';
import { GetSubjectMetadata } from '@metamask/permission-controller';
import {
  AccountsControllerGetAccountByAddressAction,
  AccountsControllerSetAccountNameAction,
  AccountsControllerSetSelectedAccountAction,
} from '@metamask/accounts-controller';
import type {
  AcceptRequest,
  AddApprovalRequest,
  EndFlow,
  RejectRequest,
  ShowError,
  ShowSuccess,
  StartFlow,
} from '@metamask/approval-controller';

export type SnapKeyringBuilderAllowActions =
  | StartFlow
  | EndFlow
  | ShowSuccess
  | ShowError
  | AddApprovalRequest
  | AcceptRequest
  | RejectRequest
  | MaybeUpdateState
  | TestOrigin
  | KeyringControllerGetAccountsAction
  | GetSubjectMetadata
  | AccountsControllerSetSelectedAccountAction
  | AccountsControllerGetAccountByAddressAction
  | AccountsControllerSetAccountNameAction;

export type SnapKeyringBuilderMessenger = RestrictedControllerMessenger<
  'SnapKeyringBuilder',
  SnapKeyringBuilderAllowActions,
  never,
  SnapKeyringBuilderAllowActions['type'],
  never
>;
