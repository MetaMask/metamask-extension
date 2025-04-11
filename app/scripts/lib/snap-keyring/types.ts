import type {
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
import type { RestrictedMessenger } from '@metamask/base-controller';
import type { SnapKeyring } from '@metamask/eth-snap-keyring';
import type { KeyringControllerGetAccountsAction } from '@metamask/keyring-controller';
import type { GetSubjectMetadata } from '@metamask/permission-controller';
import type {
  MaybeUpdateState,
  TestOrigin,
} from '@metamask/phishing-controller';
import type { GetSnap, HandleSnapRequest } from '@metamask/snaps-controllers';

import type { PreferencesControllerGetStateAction } from '../../controllers/preferences-controller';

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
  | PreferencesControllerGetStateAction;

export type SnapKeyringBuilderMessenger = RestrictedMessenger<
  'SnapKeyring',
  SnapKeyringBuilderAllowActions,
  never,
  SnapKeyringBuilderAllowActions['type'],
  never
>;

/**
 * Interface for the MetaMask Controller used by the snap keyring.
 * This interface defines only the methods needed from the controller.
 */
export type GetSnapKeyring = () => Promise<SnapKeyring>;
