import { SnapKeyringCallbacks } from '@metamask/eth-snap-keyring';

export type SnapKeyringFlow = {
  onAddAccount: SnapKeyringCallbacks['addAccount'];
  onRemoveAccount: SnapKeyringCallbacks['removeAccount'];
  onRedirectUser?: SnapKeyringCallbacks['redirectUser'];
};
