import { Messenger } from '@metamask/messenger';
import { MaybeUpdateState, TestOrigin } from '@metamask/phishing-controller';
import type { KeyringControllerGetAccountsAction } from '@metamask/keyring-controller';
import { GetSubjectMetadata } from '@metamask/permission-controller';
import {
  AccountsControllerGetAccountByAddressAction,
  AccountsControllerListMultichainAccountsAction,
  AccountsControllerSetAccountNameAction,
  AccountsControllerSetSelectedAccountAction,
} from '@metamask/accounts-controller';
import type {
  ApprovalControllerAcceptRequestAction,
  ApprovalControllerAddRequestAction,
  ApprovalControllerEndFlowAction,
  ApprovalControllerRejectRequestAction,
  ApprovalControllerShowErrorAction,
  ApprovalControllerShowSuccessAction,
  ApprovalControllerStartFlowAction,
} from '@metamask/approval-controller';
import {
  SnapControllerGetSnapAction,
  SnapControllerHandleRequestAction,
  SnapControllerIsMinimumPlatformVersionAction,
} from '@metamask/snaps-controllers';
import { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import { PreferencesControllerGetStateAction } from '../../controllers/preferences-controller';

export type SnapKeyringBuilderAllowActions =
  | ApprovalControllerStartFlowAction
  | ApprovalControllerEndFlowAction
  | ApprovalControllerShowSuccessAction
  | ApprovalControllerShowErrorAction
  | ApprovalControllerAddRequestAction
  | ApprovalControllerAcceptRequestAction
  | ApprovalControllerRejectRequestAction
  | MaybeUpdateState
  | TestOrigin
  | KeyringControllerGetAccountsAction
  | GetSubjectMetadata
  | AccountsControllerSetSelectedAccountAction
  | AccountsControllerGetAccountByAddressAction
  | AccountsControllerSetAccountNameAction
  | AccountsControllerListMultichainAccountsAction
  | SnapControllerHandleRequestAction
  | SnapControllerGetSnapAction
  | PreferencesControllerGetStateAction
  | SnapControllerIsMinimumPlatformVersionAction
  | RemoteFeatureFlagControllerGetStateAction;

export type SnapKeyringBuilderMessenger = Messenger<
  'SnapKeyring',
  SnapKeyringBuilderAllowActions
>;

export type SnapKeyringBuilderV2Messenger = SnapKeyringBuilderMessenger;
