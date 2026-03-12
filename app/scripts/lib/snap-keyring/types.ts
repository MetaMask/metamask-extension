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
  GetSnap,
  HandleSnapRequest,
  IsMinimumPlatformVersion,
} from '@metamask/snaps-controllers';
import { SnapKeyring } from '@metamask/eth-snap-keyring';
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
  | HandleSnapRequest
  | GetSnap
  | PreferencesControllerGetStateAction
  | IsMinimumPlatformVersion
  | RemoteFeatureFlagControllerGetStateAction;

export type SnapKeyringBuilderMessenger = Messenger<
  'SnapKeyring',
  SnapKeyringBuilderAllowActions,
  never
>;

/**
 * Interface for the MetaMask Controller used by the snap keyring.
 * This interface defines only the methods needed from the controller.
 */
export type GetSnapKeyring = () => Promise<SnapKeyring>;
