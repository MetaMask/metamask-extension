import React, {
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
} from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import Fuse from 'fuse.js';
import { useDispatch, useSelector } from 'react-redux';
import {
  BtcAccountType,
  EthAccountType,
  SolAccountType,
  KeyringAccountType,
} from '@metamask/keyring-api';
///: BEGIN:ONLY_INCLUDE_IF(multichain)
import { CaipChainId } from '@metamask/utils';
///: END:ONLY_INCLUDE_IF
import {
  Box,
  ButtonLink,
  ButtonLinkSize,
  ButtonSecondary,
  ButtonSecondarySize,
  IconName,
  IconSize,
  Modal,
  ModalOverlay,
  Text,
} from '../../component-library';
import { ModalContent } from '../../component-library/modal-content/deprecated';
import { ModalHeader } from '../../component-library/modal-header';
import { TextFieldSearch } from '../../component-library/text-field-search/deprecated';
import { AccountListItem } from '../account-list-item';
import { AccountListItemMenuTypes } from '../account-list-item/account-list-item.types';

import {
  AlignItems,
  BlockSize,
  Display,
  FlexDirection,
  Size,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  getConnectedSubjectsForAllAddresses,
  getHiddenAccountsList,
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  getIsAddSnapAccountEnabled,
  ///: END:ONLY_INCLUDE_IF
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  getIsWatchEthereumAccountEnabled,
  ///: END:ONLY_INCLUDE_IF
  ///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
  getIsBitcoinSupportEnabled,
  ///: END:ONLY_INCLUDE_IF
  getMetaMaskAccountsOrdered,
  getOriginOfCurrentTab,
  getSelectedInternalAccount,
  getUpdatedAndSortedAccounts,
  getDefaultHomeActiveTabName,
  ///: BEGIN:ONLY_INCLUDE_IF(solana)
  getIsSolanaSupportEnabled,
  ///: END:ONLY_INCLUDE_IF
  getHdKeyringOfSelectedAccountOrPrimaryKeyring,
  ///: BEGIN:ONLY_INCLUDE_IF(solana,bitcoin)
  getMetaMaskHdKeyrings,
  ///: END:ONLY_INCLUDE_IF
  getManageInstitutionalWallets,
  getHDEntropyIndex,
  getAllChainsToPoll,
} from '../../../selectors';
import { detectNfts, setSelectedAccount } from '../../../store/actions';
import {
  MetaMetricsEventAccountType,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import {
  CONNECT_HARDWARE_ROUTE,
  IMPORT_SRP_ROUTE,
} from '../../../helpers/constants/routes';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_POPUP } from '../../../../shared/constants/app';
///: BEGIN:ONLY_INCLUDE_IF(build-flask)
import {
  ACCOUNT_WATCHER_NAME,
  ACCOUNT_WATCHER_SNAP_ID,
  // TODO: Remove restricted import
  // eslint-disable-next-line import/no-restricted-paths
} from '../../../../app/scripts/lib/snap-keyring/account-watcher-snap';
///: END:ONLY_INCLUDE_IF

///: BEGIN:ONLY_INCLUDE_IF(multichain)
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import {
  MultichainWalletSnapClient,
  WalletClientType,
  useMultichainWalletSnapClient,
} from '../../../hooks/accounts/useMultichainWalletSnapClient';
///: END:ONLY_INCLUDE_IF
import {
  InternalAccountWithBalance,
  AccountConnections,
  MergedInternalAccount,
} from '../../../selectors/selectors.types';
import { endTrace, trace, TraceName } from '../../../../shared/lib/trace';
import {
  ACCOUNT_OVERVIEW_TAB_KEY_TO_TRACE_NAME_MAP,
  AccountOverviewTabKey,
} from '../../../../shared/constants/app-state';
import { CreateEthAccount } from '../create-eth-account';
///: BEGIN:ONLY_INCLUDE_IF(multichain)
import { CreateSnapAccount } from '../create-snap-account';
import { CreateAccountSnapOptions } from '../../../../shared/lib/accounts';
///: END:ONLY_INCLUDE_IF
import { ImportAccount } from '../import-account';
import { SrpList } from '../multi-srp/srp-list';
import { INSTITUTIONAL_WALLET_SNAP_ID } from '../../../../shared/lib/accounts/institutional-wallet-snap';
import { useSyncSRPs } from '../../../hooks/social-sync/useSyncSRPs';
import { HiddenAccountList } from './hidden-account-list';

// TODO: Should we use an enum for this instead?
const ACTION_MODES = {
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

type ActionMode = (typeof ACTION_MODES)[keyof typeof ACTION_MODES];

///: BEGIN:ONLY_INCLUDE_IF(multichain)
const SNAP_CLIENT_CONFIG_MAP: Record<
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

type AccountListMenuProps = {
  onClose: () => void;
  privacyMode?: boolean;
  showAccountCreation?: boolean;
  accountListItemProps?: object;
  allowedAccountTypes?: KeyringAccountType[];
};

export const AccountListMenu = ({
  onClose,
  privacyMode = false,
  showAccountCreation = true,
  accountListItemProps,
  allowedAccountTypes = [
    EthAccountType.Eoa,
    EthAccountType.Erc4337,
    BtcAccountType.P2wpkh,
    SolAccountType.DataAccount,
  ],
}: AccountListMenuProps) => {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const { loading: syncSRPsLoading } = useSyncSRPs();
  const hdEntropyIndex = useSelector(getHDEntropyIndex);
  useEffect(() => {
    endTrace({ name: TraceName.AccountList });
  }, []);
  const accounts: InternalAccountWithBalance[] = useSelector(
    getMetaMaskAccountsOrdered,
  );
  const filteredAccounts = useMemo(
    () =>
      accounts.filter((account: InternalAccountWithBalance) =>
        allowedAccountTypes.includes(account.type),
      ),
    [accounts, allowedAccountTypes],
  );
  const allChainIds = useSelector(getAllChainsToPoll);
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const connectedSites = useSelector(
    getConnectedSubjectsForAllAddresses,
  ) as AccountConnections;
  const currentTabOrigin = useSelector(getOriginOfCurrentTab);
  const history = useHistory();
  const dispatch = useDispatch();

  const [searchQuery, setSearchQuery] = useState('');
  const [actionMode, setActionMode] = useState<ActionMode>(ACTION_MODES.LIST);
  const [previousActionMode, setPreviousActionMode] = useState<ActionMode>(
    ACTION_MODES.LIST,
  );
  const hiddenAddresses = useSelector(getHiddenAccountsList);
  const updatedAccountsList = useSelector(getUpdatedAndSortedAccounts);
  const filteredUpdatedAccountList = useMemo(
    () =>
      updatedAccountsList.filter((account) =>
        allowedAccountTypes.includes(account.type),
      ),
    [updatedAccountsList, allowedAccountTypes],
  );
  const defaultHomeActiveTabName: AccountOverviewTabKey = useSelector(
    getDefaultHomeActiveTabName,
  );
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  const addSnapAccountEnabled = useSelector(getIsAddSnapAccountEnabled);
  ///: END:ONLY_INCLUDE_IF
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  const isAddWatchEthereumAccountEnabled = useSelector(
    getIsWatchEthereumAccountEnabled,
  );

  const handleAddWatchAccount = useCallback(async () => {
    await trackEvent({
      category: MetaMetricsEventCategory.Navigation,
      event: MetaMetricsEventName.AccountAddSelected,
      properties: {
        account_type: MetaMetricsEventAccountType.Snap,
        snap_id: ACCOUNT_WATCHER_SNAP_ID,
        snap_name: ACCOUNT_WATCHER_NAME,
        location: 'Main Menu',
        hd_entropy_index: hdEntropyIndex,
      },
    });
    onClose();
    history.push(`/snaps/view/${encodeURIComponent(ACCOUNT_WATCHER_SNAP_ID)}`);
  }, [trackEvent, onClose, history]);
  ///: END:ONLY_INCLUDE_IF

  ///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
  const bitcoinSupportEnabled = useSelector(getIsBitcoinSupportEnabled);
  const bitcoinWalletSnapClient = useMultichainWalletSnapClient(
    WalletClientType.Bitcoin,
  );
  ///: END:ONLY_INCLUDE_IF

  ///: BEGIN:ONLY_INCLUDE_IF(solana)
  const solanaSupportEnabled = useSelector(getIsSolanaSupportEnabled);
  const solanaWalletSnapClient = useMultichainWalletSnapClient(
    WalletClientType.Solana,
  );
  ///: END:ONLY_INCLUDE_IF
  ///: BEGIN:ONLY_INCLUDE_IF(solana,bitcoin)
  const [primaryKeyring] = useSelector(getMetaMaskHdKeyrings);

  const handleMultichainSnapAccountCreation = async (
    client: MultichainWalletSnapClient,
    _options: CreateAccountSnapOptions,
    action: ActionMode,
  ) => {
    trackEvent({
      category: MetaMetricsEventCategory.Navigation,
      event: MetaMetricsEventName.AccountAddSelected,
      properties: {
        account_type: MetaMetricsEventAccountType.Snap,
        snap_id: client.getSnapId(),
        snap_name: client.getSnapName(),
        location: 'Main Menu',
        hd_entropy_index: hdEntropyIndex,
        chain_id_caip: _options.scope,
      },
    });

    return setActionMode(action);
  };
  ///: END:ONLY_INCLUDE_IF
  const manageInstitutionalWallets = useSelector(getManageInstitutionalWallets);

  // Here we are getting the keyring of the last selected account
  // if it is not an hd keyring, we will use the primary keyring
  const hdKeyring = useSelector(getHdKeyringOfSelectedAccountOrPrimaryKeyring);
  const [selectedKeyringId, setSelectedKeyringId] = useState(
    hdKeyring.metadata.id,
  );

  const searchResults: MergedInternalAccount[] = useMemo(() => {
    let _searchResults: MergedInternalAccount[] = filteredUpdatedAccountList;
    if (searchQuery) {
      const fuse = new Fuse(filteredAccounts, {
        threshold: 0.2,
        location: 0,
        distance: 100,
        maxPatternLength: 32,
        minMatchCharLength: 1,
        keys: ['metadata.name', 'address'],
      });
      fuse.setCollection(filteredAccounts);
      _searchResults = fuse.search(searchQuery);
    }

    return _searchResults;
  }, [filteredAccounts, filteredUpdatedAccountList, searchQuery]);

  const title = useMemo(
    () => getActionTitle(t as (text: string) => string, actionMode),
    [actionMode, t],
  );

  // eslint-disable-next-line no-empty-function
  let onBack;
  if (actionMode !== ACTION_MODES.LIST) {
    if (actionMode === ACTION_MODES.MENU) {
      onBack = () => setActionMode(ACTION_MODES.LIST);
    } else if (actionMode === ACTION_MODES.SELECT_SRP) {
      onBack = () => setActionMode(previousActionMode);
    } else {
      onBack = () => setActionMode(ACTION_MODES.MENU);
    }
  }

  const onAccountListItemItemClicked = useCallback(
    (account: MergedInternalAccount) => {
      onClose();
      trackEvent({
        category: MetaMetricsEventCategory.Navigation,
        event: MetaMetricsEventName.NavAccountSwitched,
        properties: {
          location: 'Main Menu',
          hd_entropy_index: hdEntropyIndex,
        },
      });
      endTrace({
        name: ACCOUNT_OVERVIEW_TAB_KEY_TO_TRACE_NAME_MAP[
          defaultHomeActiveTabName
        ],
      });
      trace({
        name: ACCOUNT_OVERVIEW_TAB_KEY_TO_TRACE_NAME_MAP[
          defaultHomeActiveTabName
        ],
      });
      dispatch(setSelectedAccount(account.address));
      dispatch(detectNfts(allChainIds));
    },
    [
      dispatch,
      onClose,
      trackEvent,
      defaultHomeActiveTabName,
      hdEntropyIndex,
      allChainIds,
    ],
  );

  const accountListItems = useMemo(() => {
    return searchResults.map((account) => {
      const connectedSite = connectedSites[account.address]?.find(
        ({ origin }) => origin === currentTabOrigin,
      );

      const hideAccountListItem = searchQuery.length === 0 && account.hidden;

      /* NOTE: Hidden account will be displayed only in the search list */

      return (
        <Box
          className={
            account.hidden
              ? 'multichain-account-menu-popover__list--menu-item-hidden'
              : 'multichain-account-menu-popover__list--menu-item'
          }
          display={hideAccountListItem ? Display.None : Display.Block}
          key={account.address}
        >
          <AccountListItem
            onClick={onAccountListItemItemClicked}
            account={account}
            key={account.address}
            selected={selectedAccount.address === account.address}
            closeMenu={onClose}
            connectedAvatar={connectedSite?.iconUrl}
            menuType={AccountListItemMenuTypes.Account}
            isPinned={Boolean(account.pinned)}
            isHidden={Boolean(account.hidden)}
            currentTabOrigin={currentTabOrigin}
            isActive={Boolean(account.active)}
            privacyMode={privacyMode}
            {...accountListItemProps}
          />
        </Box>
      );
    });
  }, [
    searchResults,
    connectedSites,
    currentTabOrigin,
    privacyMode,
    accountListItemProps,
    selectedAccount,
    onClose,
    onAccountListItemItemClicked,
    searchQuery,
  ]);

  const onActionComplete = useCallback(
    async (confirmed: boolean) => {
      if (confirmed) {
        onClose();
      } else {
        setActionMode(ACTION_MODES.LIST);
      }
    },
    [onClose, setActionMode],
  );

  const onSelectSrp = useCallback(() => {
    trackEvent({
      category: MetaMetricsEventCategory.Accounts,
      event: MetaMetricsEventName.SecretRecoveryPhrasePickerClicked,
      properties: {
        button_type: 'picker',
      },
    });
    setPreviousActionMode(actionMode);
    setActionMode(ACTION_MODES.SELECT_SRP);
  }, [setActionMode, actionMode, trackEvent]);

  ///: BEGIN:ONLY_INCLUDE_IF(multichain)
  const { clientType, chainId } = SNAP_CLIENT_CONFIG_MAP[actionMode] || {
    clientType: null,
    chainId: null,
  };
  ///: END:ONLY_INCLUDE_IF(multichain)

  return (
    <Modal isOpen onClose={onClose}>
      {syncSRPsLoading && <p>Syncing seed phrases...</p>}
      <ModalOverlay />
      <ModalContent
        className="multichain-account-menu-popover"
        modalDialogProps={{
          className: 'multichain-account-menu-popover__dialog',
          padding: 0,
          display: Display.Flex,
          flexDirection: FlexDirection.Column,
        }}
      >
        <ModalHeader padding={4} onClose={onClose} onBack={onBack}>
          {title}
        </ModalHeader>
        {actionMode === ACTION_MODES.ADD ? (
          <Box paddingLeft={4} paddingRight={4} paddingBottom={4}>
            <CreateEthAccount
              onActionComplete={onActionComplete}
              selectedKeyringId={selectedKeyringId}
              onSelectSrp={onSelectSrp}
            />
          </Box>
        ) : null}
        {
          ///: BEGIN:ONLY_INCLUDE_IF(multichain)
          clientType && chainId ? (
            <Box paddingLeft={4} paddingRight={4} paddingBottom={4}>
              <CreateSnapAccount
                onActionComplete={onActionComplete}
                selectedKeyringId={selectedKeyringId}
                onSelectSrp={onSelectSrp}
                clientType={clientType}
                chainId={chainId}
              />
            </Box>
          ) : null
          ///: END:ONLY_INCLUDE_IF(multichain)
        }
        {actionMode === ACTION_MODES.IMPORT ? (
          <Box
            paddingLeft={4}
            paddingRight={4}
            paddingBottom={4}
            paddingTop={0}
          >
            <ImportAccount onActionComplete={onActionComplete} />
          </Box>
        ) : null}
        {actionMode === ACTION_MODES.SELECT_SRP && (
          <SrpList
            onActionComplete={(keyringId: string) => {
              setSelectedKeyringId(keyringId);
              setActionMode(previousActionMode);
            }}
          />
        )}

        {/* Add / Import / Hardware Menu */}
        {actionMode === ACTION_MODES.MENU ? (
          <Box padding={4}>
            <Text
              variant={TextVariant.bodySmMedium}
              marginBottom={2}
              color={TextColor.textAlternative}
            >
              {t('createNewAccountHeader')}
            </Text>
            <Box>
              <ButtonLink
                size={ButtonLinkSize.Sm}
                startIconName={IconName.Add}
                startIconProps={{ size: IconSize.Md }}
                onClick={() => {
                  trackEvent({
                    category: MetaMetricsEventCategory.Navigation,
                    event: MetaMetricsEventName.AccountAddSelected,
                    properties: {
                      account_type: MetaMetricsEventAccountType.Default,
                      location: 'Main Menu',
                      hd_entropy_index: hdEntropyIndex,
                    },
                  });
                  setActionMode(ACTION_MODES.ADD);
                }}
                data-testid="multichain-account-menu-popover-add-account"
              >
                {t('addNewEthereumAccountLabel')}
              </ButtonLink>
            </Box>
            {
              ///: BEGIN:ONLY_INCLUDE_IF(solana)
              solanaSupportEnabled && (
                <Box marginTop={4}>
                  <ButtonLink
                    size={ButtonLinkSize.Sm}
                    startIconName={IconName.Add}
                    startIconProps={{ size: IconSize.Md }}
                    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
                    // eslint-disable-next-line @typescript-eslint/no-misused-promises
                    onClick={async () => {
                      await handleMultichainSnapAccountCreation(
                        solanaWalletSnapClient,
                        {
                          scope: MultichainNetworks.SOLANA,
                          entropySource: primaryKeyring.metadata.id,
                        },
                        ACTION_MODES.ADD_SOLANA,
                      );
                    }}
                    data-testid="multichain-account-menu-popover-add-solana-account"
                  >
                    {t('addNewSolanaAccountLabel')}
                  </ButtonLink>
                </Box>
              )
              ///: END:ONLY_INCLUDE_IF
            }
            {
              ///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
              bitcoinSupportEnabled && (
                <Box marginTop={4}>
                  <ButtonLink
                    size={ButtonLinkSize.Sm}
                    startIconName={IconName.Add}
                    startIconProps={{ size: IconSize.Md }}
                    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
                    // eslint-disable-next-line @typescript-eslint/no-misused-promises
                    onClick={async () => {
                      return await handleMultichainSnapAccountCreation(
                        bitcoinWalletSnapClient,
                        {
                          scope: MultichainNetworks.BITCOIN,
                          entropySource: primaryKeyring.metadata.id,
                        },
                        ACTION_MODES.ADD_BITCOIN,
                      );
                    }}
                    data-testid="multichain-account-menu-popover-add-btc-account"
                  >
                    {t('addBitcoinAccountLabel')}
                  </ButtonLink>
                </Box>
              )
              ///: END:ONLY_INCLUDE_IF
            }

            <Text
              variant={TextVariant.bodySmMedium}
              marginTop={4}
              marginBottom={2}
              color={TextColor.textAlternative}
            >
              {t('importWalletOrAccountHeader')}
            </Text>
            {
              <Box marginTop={4}>
                <ButtonLink
                  size={ButtonLinkSize.Sm}
                  startIconName={IconName.Wallet}
                  startIconProps={{ size: IconSize.Md }}
                  onClick={() => {
                    trackEvent({
                      category: MetaMetricsEventCategory.Navigation,
                      event:
                        MetaMetricsEventName.ImportSecretRecoveryPhraseClicked,
                    });
                    history.push(IMPORT_SRP_ROUTE);
                    onClose();
                  }}
                  data-testid="multichain-account-menu-popover-import-srp"
                >
                  {t('secretRecoveryPhrase')}
                </ButtonLink>
              </Box>
            }

            <Box marginTop={4}>
              <ButtonLink
                size={ButtonLinkSize.Sm}
                startIconName={IconName.Key}
                startIconProps={{ size: IconSize.Md }}
                data-testid="multichain-account-menu-popover-add-imported-account"
                onClick={() => {
                  trackEvent({
                    category: MetaMetricsEventCategory.Navigation,
                    event: MetaMetricsEventName.AccountAddSelected,
                    properties: {
                      account_type: MetaMetricsEventAccountType.Imported,
                      location: 'Main Menu',
                      hd_entropy_index: hdEntropyIndex,
                    },
                  });
                  setActionMode(ACTION_MODES.IMPORT);
                }}
              >
                {t('importPrivateKey')}
              </ButtonLink>
            </Box>
            <Text
              variant={TextVariant.bodySmMedium}
              marginTop={4}
              marginBottom={2}
              color={TextColor.textAlternative}
            >
              {t('connectAnAccountHeader')}
            </Text>
            <Box marginTop={4}>
              <ButtonLink
                size={ButtonLinkSize.Sm}
                startIconName={IconName.Hardware}
                startIconProps={{ size: IconSize.Md }}
                onClick={() => {
                  onClose();
                  trackEvent({
                    category: MetaMetricsEventCategory.Navigation,
                    event: MetaMetricsEventName.AccountAddSelected,
                    properties: {
                      account_type: MetaMetricsEventAccountType.Hardware,
                      location: 'Main Menu',
                      hd_entropy_index: hdEntropyIndex,
                    },
                  });
                  if (getEnvironmentType() === ENVIRONMENT_TYPE_POPUP) {
                    global.platform.openExtensionInBrowser?.(
                      CONNECT_HARDWARE_ROUTE,
                    );
                  } else {
                    history.push(CONNECT_HARDWARE_ROUTE);
                  }
                }}
              >
                {t('addHardwareWalletLabel')}
              </ButtonLink>
            </Box>
            {
              ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
              addSnapAccountEnabled ? (
                <Box marginTop={4}>
                  <ButtonLink
                    size={ButtonLinkSize.Sm}
                    startIconName={IconName.Snaps}
                    startIconProps={{ size: IconSize.Md }}
                    onClick={() => {
                      onClose();
                      trackEvent({
                        category: MetaMetricsEventCategory.Navigation,
                        event: MetaMetricsEventName.AccountAddSelected,
                        properties: {
                          account_type: MetaMetricsEventAccountType.Snap,
                          location: 'Main Menu',
                          hd_entropy_index: hdEntropyIndex,
                        },
                      });
                      global.platform.openTab({
                        url: process.env.ACCOUNT_SNAPS_DIRECTORY_URL as string,
                      });
                    }}
                  >
                    {t('settingAddSnapAccount')}
                  </ButtonLink>
                </Box>
              ) : null
              ///: END:ONLY_INCLUDE_IF
            }
            {
              ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
              isAddWatchEthereumAccountEnabled && (
                <Box marginTop={4}>
                  <ButtonLink
                    disabled={!isAddWatchEthereumAccountEnabled}
                    size={ButtonLinkSize.Sm}
                    startIconName={IconName.Eye}
                    startIconProps={{ size: IconSize.Md }}
                    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
                    // eslint-disable-next-line @typescript-eslint/no-misused-promises
                    onClick={handleAddWatchAccount}
                    data-testid="multichain-account-menu-popover-add-watch-only-account"
                  >
                    {t('addEthereumWatchOnlyAccount')}
                  </ButtonLink>
                </Box>
              )
              ///: END:ONLY_INCLUDE_IF
            }
            {manageInstitutionalWallets && (
              <Box marginTop={4}>
                <ButtonLink
                  size={ButtonLinkSize.Sm}
                  startIconName={IconName.Add}
                  onClick={() => {
                    onClose();
                    history.push(
                      `/snaps/view/${encodeURIComponent(
                        INSTITUTIONAL_WALLET_SNAP_ID,
                      )}`,
                    );
                  }}
                >
                  {t('manageInstitutionalWallets')}
                </ButtonLink>
              </Box>
            )}
          </Box>
        ) : null}
        {actionMode === ACTION_MODES.LIST ? (
          <>
            {/* Search box */}
            {filteredAccounts.length > 1 ? (
              <Box
                paddingLeft={4}
                paddingRight={4}
                paddingBottom={4}
                paddingTop={0}
              >
                <TextFieldSearch
                  size={Size.SM}
                  width={BlockSize.Full}
                  placeholder={t('searchAccounts')}
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearchQuery(e.target.value)
                  }
                  clearButtonOnClick={() => setSearchQuery('')}
                  clearButtonProps={{
                    size: Size.SM,
                  }}
                  inputProps={{ autoFocus: true }}
                  endAccessory={null}
                  className=""
                />
              </Box>
            ) : null}
            {/* Account list block */}
            <Box className="multichain-account-menu-popover__list">
              {searchResults.length === 0 && searchQuery !== '' ? (
                <Text
                  paddingLeft={4}
                  paddingRight={4}
                  color={TextColor.textMuted}
                  data-testid="multichain-account-menu-popover-no-results"
                >
                  {t('noAccountsFound')}
                </Text>
              ) : null}
              {accountListItems}
              {/* Hidden Accounts, this component shows hidden accounts in account list Item*/}
              {hiddenAddresses.length > 0 ? (
                <HiddenAccountList onClose={onClose} />
              ) : null}
            </Box>
            {/* Add / Import / Hardware button */}
            {showAccountCreation ? (
              <Box
                paddingTop={2}
                paddingBottom={4}
                paddingLeft={4}
                paddingRight={4}
                alignItems={AlignItems.center}
                display={Display.Flex}
              >
                <ButtonSecondary
                  startIconName={IconName.Add}
                  size={ButtonSecondarySize.Lg}
                  block
                  onClick={() => setActionMode(ACTION_MODES.MENU)}
                  data-testid="multichain-account-menu-popover-action-button"
                >
                  {t('addImportAccount')}
                </ButtonSecondary>
              </Box>
            ) : null}
          </>
        ) : null}
      </ModalContent>
    </Modal>
  );
};

AccountListMenu.propTypes = {
  /**
   * Function that executes when the menu closes
   */
  onClose: PropTypes.func.isRequired,
  /**
   * Represents if the button to create new accounts should display
   */
  showAccountCreation: PropTypes.bool,
  /**
   * Props to pass to the AccountListItem,
   */
  accountListItemProps: PropTypes.object,
  /**
   * Filters the account types to be included in the account list
   */
  allowedAccountTypes: PropTypes.array,
};
