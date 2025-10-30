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
  AcceptRequest,
  AddApprovalRequest,
  EndFlow,
  RejectRequest,
  ShowError,
  ShowSuccess,
  StartFlow,
} from '@metamask/approval-controller';
import {
  GetSnap,
  HandleSnapRequest,
  IsMinimumPlatformVersion,
} from '@metamask/snaps-controllers';
import { SnapKeyring } from '@metamask/eth-snap-keyring';
import { PreferencesControllerGetStateAction } from '../../controllers/preferences-controller';

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
  | AccountsControllerSetAccountNameAction
  | AccountsControllerListMultichainAccountsAction
  | HandleSnapRequest
  | GetSnap
  | PreferencesControllerGetStateAction
  | IsMinimumPlatformVersion;

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
