import { Messenger } from '@metamask/messenger';
import { MaybeUpdateState, TestOrigin } from '@metamask/phishing-controller';
import type {
  KeyringControllerGetAccountsAction,
  KeyringControllerPersistAllKeyringsAction,
} from '@metamask/keyring-controller';
import { GetSubjectMetadata } from '@metamask/permission-controller';
import {
  AccountsControllerGetAccountByAddressAction,
  AccountsControllerListMultichainAccountsAction,
  AccountsControllerSetAccountNameAction,
  AccountsControllerSetSelectedAccountAction,
  AccountsControllerUpdateAccountsAction,
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
import { LegacyBackgroundApiServiceRemoveAccountAction } from '../../services/legacy-background-api-service-method-action-types';

export type SnapKeyringBuilderAllowedActions =
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
  | AccountsControllerUpdateAccountsAction
  | SnapControllerHandleRequestAction
  | SnapControllerGetSnapAction
  | PreferencesControllerGetStateAction
  | SnapControllerIsMinimumPlatformVersionAction
  | RemoteFeatureFlagControllerGetStateAction
  | KeyringControllerPersistAllKeyringsAction
  | LegacyBackgroundApiServiceRemoveAccountAction;

export type SnapKeyringBuilderMessenger = Messenger<
  'SnapKeyring',
  SnapKeyringBuilderAllowedActions
>;

export type SnapKeyringV2BuilderMessenger = SnapKeyringBuilderMessenger;
