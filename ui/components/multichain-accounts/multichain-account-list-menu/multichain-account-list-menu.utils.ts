///: BEGIN:ONLY_INCLUDE_IF(multichain)
import { CaipChainId } from '@metamask/utils';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks.ts';
import { WalletClientType } from '../../../hooks/accounts/useMultichainWalletSnapClient.ts';
///: END:ONLY_INCLUDE_IF

export type ActionMode = (typeof ACTION_MODES)[keyof typeof ACTION_MODES];

// TODO: Should we use an enum for this instead?
export const ACTION_MODES = {
  // Displays the search box and account list
  LIST: '',
  // Displays the Add, Import, Hardware accounts
  MENU: 'menu',
  // Displays the add account form controls
  ADD: 'add',
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  // Displays the add account form controls (for watch-only account)
  ADD_WATCH_ONLY: 'add-watch-only',
  ///: END:ONLY_INCLUDE_IF
  ///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
  // Displays the add account form controls (for bitcoin account)
  ADD_BITCOIN: 'add-bitcoin',
  ///: END:ONLY_INCLUDE_IF
  ///: BEGIN:ONLY_INCLUDE_IF(solana)
  // Displays the add account form controls (for solana account)
  ADD_SOLANA: 'add-solana',
  ///: END:ONLY_INCLUDE_IF
  // Displays the import account form controls
  IMPORT: 'import',
  CREATE_SRP: 'create-srp',
  IMPORT_SRP: 'import-srp',
  SELECT_SRP: 'select-srp',
} as const;

///: BEGIN:ONLY_INCLUDE_IF(multichain)
export const SNAP_CLIENT_CONFIG_MAP: Record<
  string,
  { clientType: WalletClientType | null; chainId: CaipChainId | null }
> = {
  [ACTION_MODES.ADD_BITCOIN]: {
    clientType: WalletClientType.Bitcoin,
    chainId: MultichainNetworks.BITCOIN,
  },
  [ACTION_MODES.ADD_SOLANA]: {
    clientType: WalletClientType.Solana,
    chainId: MultichainNetworks.SOLANA,
  },
};
///: END:ONLY_INCLUDE_IF(multichain)

/**
 * Gets the title for a given action mode.
 *
 * @param t - Function to translate text.
 * @param actionMode - An action mode.
 * @returns The title for this action mode.
 */
export const getActionTitle = (
  t: (text: string, args?: string[]) => string,
  actionMode: ActionMode,
) => {
  switch (actionMode) {
    case ACTION_MODES.ADD:
      return t('addAccountFromNetwork', [t('networkNameEthereum')]);
    case ACTION_MODES.MENU:
      return t('addAccount');
    ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
    case ACTION_MODES.ADD_WATCH_ONLY:
      return t('addAccountFromNetwork', [t('networkNameEthereum')]);
    ///: END:ONLY_INCLUDE_IF
    ///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
    case ACTION_MODES.ADD_BITCOIN:
      return t('addAccountFromNetwork', [t('networkNameBitcoin')]);
    ///: END:ONLY_INCLUDE_IF
    ///: BEGIN:ONLY_INCLUDE_IF(solana)
    case ACTION_MODES.ADD_SOLANA:
      return t('addAccountFromNetwork', [t('networkNameSolana')]);
    ///: END:ONLY_INCLUDE_IF
    case ACTION_MODES.IMPORT:
      return t('importPrivateKey');
    case ACTION_MODES.CREATE_SRP:
      return t('createSecretRecoveryPhrase');
    case ACTION_MODES.IMPORT_SRP:
      return t('importSecretRecoveryPhrase');
    case ACTION_MODES.SELECT_SRP:
      return t('selectSecretRecoveryPhrase');
    default:
      return t('selectAnAccount');
  }
};
