import React, {
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
} from 'react';
import PropTypes from 'prop-types';
import {
  useHistory,
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  useLocation,
  ///: END:ONLY_INCLUDE_IF
} from 'react-router-dom';
import Fuse from 'fuse.js';
import { useDispatch, useSelector } from 'react-redux';
import {
  BtcAccountType,
  EthAccountType,
  SolAccountType,
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  InternalAccount,
  KeyringAccountType,
  ///: END:ONLY_INCLUDE_IF
} from '@metamask/keyring-api';
///: BEGIN:ONLY_INCLUDE_IF(build-flask)
import {
  BITCOIN_WALLET_NAME,
  BITCOIN_WALLET_SNAP_ID,
} from '../../../../shared/lib/accounts/bitcoin-wallet-snap';
///: END:ONLY_INCLUDE_IF
import {
  Box,
  ButtonLink,
  ButtonLinkSize,
  ButtonSecondary,
  ButtonSecondarySize,
  IconName,
  Modal,
  ModalOverlay,
  Text,
} from '../../component-library';
import { ModalContent } from '../../component-library/modal-content/deprecated';
import { ModalHeader } from '../../component-library/modal-header';
import { TextFieldSearch } from '../../component-library/text-field-search/deprecated';
import {
  AccountListItem,
  AccountListItemMenuTypes,
  CreateEthAccount,
  ImportAccount,
} from '..';
import {
  AlignItems,
  BlockSize,
  Display,
  FlexDirection,
  Size,
  TextColor,
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
  getIsBitcoinSupportEnabled,
  getIsBitcoinTestnetSupportEnabled,
  ///: END:ONLY_INCLUDE_IF
  getMetaMaskAccountsOrdered,
  getOriginOfCurrentTab,
  getSelectedInternalAccount,
  getUpdatedAndSortedAccounts,
  getDefaultHomeActiveTabName,
  ///: BEGIN:ONLY_INCLUDE_IF(solana)
  getIsSolanaSupportEnabled,
  ///: END:ONLY_INCLUDE_IF
} from '../../../selectors';
import { setSelectedAccount } from '../../../store/actions';
import {
  MetaMetricsEventAccountType,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import {
  CONNECT_HARDWARE_ROUTE,
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  CONFIRMATION_V_NEXT_ROUTE,
  SETTINGS_ROUTE,
  ///: END:ONLY_INCLUDE_IF
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  CUSTODY_ACCOUNT_ROUTE,
  ///: END:ONLY_INCLUDE_IF
} from '../../../helpers/constants/routes';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_POPUP } from '../../../../shared/constants/app';
import { getAccountLabel } from '../../../helpers/utils/accounts';
///: BEGIN:ONLY_INCLUDE_IF(build-flask)
import {
  ACCOUNT_WATCHER_NAME,
  ACCOUNT_WATCHER_SNAP_ID,
  // TODO: Remove restricted import
  // eslint-disable-next-line import/no-restricted-paths
} from '../../../../app/scripts/lib/snap-keyring/account-watcher-snap';
import {
  hasCreatedBtcMainnetAccount,
  hasCreatedBtcTestnetAccount,
} from '../../../selectors/accounts';
///: END:ONLY_INCLUDE_IF

///: BEGIN:ONLY_INCLUDE_IF(build-flask,solana)
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import {
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
///: BEGIN:ONLY_INCLUDE_IF(solana)
import {
  SOLANA_WALLET_NAME,
  SOLANA_WALLET_SNAP_ID,
} from '../../../../shared/lib/accounts/solana-wallet-snap';
///: END:ONLY_INCLUDE_IF
import { HiddenAccountList } from './hidden-account-list';

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
  // Displays the add account form controls (for bitcoin account)
  ADD_BITCOIN: 'add-bitcoin',
  // Same but for testnet
  ADD_BITCOIN_TESTNET: 'add-bitcoin-testnet',
  ///: END:ONLY_INCLUDE_IF
  // Displays the import account form controls
  IMPORT: 'import',
};

/**
 * Gets the title for a given action mode.
 *
 * @param t - Function to translate text.
 * @param actionMode - An action mode.
 * @returns The title for this action mode.
 */
export const getActionTitle = (
  t: (text: string) => string,
  actionMode: string,
) => {
  switch (actionMode) {
    case ACTION_MODES.ADD:
    case ACTION_MODES.MENU:
      return t('addAccount');
    ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
    case ACTION_MODES.ADD_WATCH_ONLY:
    case ACTION_MODES.ADD_BITCOIN:
      return t('addAccount');
    case ACTION_MODES.ADD_BITCOIN_TESTNET:
      return t('addAccount');
    ///: END:ONLY_INCLUDE_IF
    case ACTION_MODES.IMPORT:
      return t('importAccount');
    default:
      return t('selectAnAccount');
  }
};

/**
 * Merges ordered accounts with balances with each corresponding account data from internal accounts
 *
 * @param accountsWithBalances - ordered accounts with balances
 * @param internalAccounts - internal accounts
 * @returns merged accounts list with balances and internal account data
 */
export const mergeAccounts = (
  accountsWithBalances: MergedInternalAccount[],
  internalAccounts: InternalAccount[],
) => {
  return accountsWithBalances.map((account) => {
    const internalAccount = internalAccounts.find(
      (intAccount) => intAccount.address === account.address,
    );
    if (internalAccount) {
      return {
        ...account,
        ...internalAccount,
        keyring: internalAccount.metadata.keyring,
        label: getAccountLabel(
          internalAccount.metadata.keyring.type,
          internalAccount,
        ),
      };
    }
    return account;
  });
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
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const connectedSites = useSelector(
    getConnectedSubjectsForAllAddresses,
  ) as AccountConnections;
  const currentTabOrigin = useSelector(getOriginOfCurrentTab);
  const history = useHistory();
  const dispatch = useDispatch();
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  const { pathname } = useLocation();
  ///: END:ONLY_INCLUDE_IF
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
      },
    });
    onClose();
    history.push(`/snaps/view/${encodeURIComponent(ACCOUNT_WATCHER_SNAP_ID)}`);
  }, [trackEvent, onClose, history]);

  const bitcoinSupportEnabled = useSelector(getIsBitcoinSupportEnabled);
  const bitcoinTestnetSupportEnabled = useSelector(
    getIsBitcoinTestnetSupportEnabled,
  );
  const isBtcMainnetAccountAlreadyCreated = useSelector(
    hasCreatedBtcMainnetAccount,
  );
  const isBtcTestnetAccountAlreadyCreated = useSelector(
    hasCreatedBtcTestnetAccount,
  );

  const bitcoinWalletSnapClient = useMultichainWalletSnapClient(
    WalletClientType.Bitcoin,
  );
  const handleAccountCreation = async (network: MultichainNetworks) => {
    // The account creation + renaming is handled by the Snap account bridge, so
    // we need to close the current modal
    onClose();
    if (pathname.includes(SETTINGS_ROUTE)) {
      // The settings route does not redirect pending confirmations. We need to redirect manually here.
      history.push(CONFIRMATION_V_NEXT_ROUTE);
    }

    await bitcoinWalletSnapClient.createAccount(network);
  };
  ///: END:ONLY_INCLUDE_IF

  ///: BEGIN:ONLY_INCLUDE_IF(solana)
  const solanaSupportEnabled = useSelector(getIsSolanaSupportEnabled);
  const solanaWalletSnapClient = useMultichainWalletSnapClient(
    WalletClientType.Solana,
  );

  ///: END:ONLY_INCLUDE_IF

  const [searchQuery, setSearchQuery] = useState('');
  const [actionMode, setActionMode] = useState(ACTION_MODES.LIST);

  let searchResults: MergedInternalAccount[] = filteredUpdatedAccountList;
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
    searchResults = fuse.search(searchQuery);
  }
  searchResults = mergeAccounts(searchResults, filteredAccounts);

  const title = useMemo(
    () => getActionTitle(t as (text: string) => string, actionMode),
    [actionMode, t],
  );

  // eslint-disable-next-line no-empty-function
  let onBack;
  if (actionMode !== ACTION_MODES.LIST) {
    if (actionMode === ACTION_MODES.MENU) {
      onBack = () => setActionMode(ACTION_MODES.LIST);
    } else {
      onBack = () => setActionMode(ACTION_MODES.MENU);
    }
  }

  const onAccountListItemItemClicked = useCallback(
    (account) => {
      return () => {
        onClose();
        trackEvent({
          category: MetaMetricsEventCategory.Navigation,
          event: MetaMetricsEventName.NavAccountSwitched,
          properties: {
            location: 'Main Menu',
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
      };
    },
    [dispatch, onClose, trackEvent],
  );

  return (
    <Modal isOpen onClose={onClose}>
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
              onActionComplete={(confirmed) => {
                if (confirmed) {
                  onClose();
                } else {
                  setActionMode(ACTION_MODES.LIST);
                }
              }}
            />
          </Box>
        ) : null}
        {actionMode === ACTION_MODES.IMPORT ? (
          <Box
            paddingLeft={4}
            paddingRight={4}
            paddingBottom={4}
            paddingTop={0}
          >
            <ImportAccount
              onActionComplete={(confirmed) => {
                if (confirmed) {
                  onClose();
                } else {
                  setActionMode(ACTION_MODES.LIST);
                }
              }}
            />
          </Box>
        ) : null}
        {/* Add / Import / Hardware Menu */}
        {actionMode === ACTION_MODES.MENU ? (
          <Box padding={4}>
            <Box>
              <ButtonLink
                size={ButtonLinkSize.Sm}
                startIconName={IconName.Add}
                onClick={() => {
                  trackEvent({
                    category: MetaMetricsEventCategory.Navigation,
                    event: MetaMetricsEventName.AccountAddSelected,
                    properties: {
                      account_type: MetaMetricsEventAccountType.Default,
                      location: 'Main Menu',
                    },
                  });
                  setActionMode(ACTION_MODES.ADD);
                }}
                data-testid="multichain-account-menu-popover-add-account"
              >
                {t('addNewAccount')}
              </ButtonLink>
            </Box>
            {
              ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
              bitcoinSupportEnabled && (
                <Box marginTop={4}>
                  <ButtonLink
                    disabled={isBtcMainnetAccountAlreadyCreated}
                    size={ButtonLinkSize.Sm}
                    startIconName={IconName.Add}
                    onClick={async () => {
                      trackEvent({
                        category: MetaMetricsEventCategory.Navigation,
                        event: MetaMetricsEventName.AccountAddSelected,
                        properties: {
                          account_type: MetaMetricsEventAccountType.Snap,
                          snap_id: BITCOIN_WALLET_SNAP_ID,
                          snap_name: BITCOIN_WALLET_NAME,
                          location: 'Main Menu',
                        },
                      });

                      await handleAccountCreation(MultichainNetworks.BITCOIN);
                    }}
                    data-testid="multichain-account-menu-popover-add-btc-account"
                  >
                    {t('addNewBitcoinAccount')}
                  </ButtonLink>
                </Box>
              )
              ///: END:ONLY_INCLUDE_IF
            }
            {
              ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
              bitcoinTestnetSupportEnabled ? (
                <Box marginTop={4}>
                  <ButtonLink
                    disabled={isBtcTestnetAccountAlreadyCreated}
                    size={ButtonLinkSize.Sm}
                    startIconName={IconName.Add}
                    onClick={async () => {
                      await handleAccountCreation(
                        MultichainNetworks.BITCOIN_TESTNET,
                      );
                    }}
                    data-testid="multichain-account-menu-popover-add-btc-account-testnet"
                  >
                    {t('addNewBitcoinTestnetAccount')}
                  </ButtonLink>
                </Box>
              ) : null
              ///: END:ONLY_INCLUDE_IF
            }
            {
              ///: BEGIN:ONLY_INCLUDE_IF(solana)
              solanaSupportEnabled && (
                <Box marginTop={4}>
                  <ButtonLink
                    size={ButtonLinkSize.Sm}
                    startIconName={IconName.Add}
                    onClick={async () => {
                      trackEvent({
                        category: MetaMetricsEventCategory.Navigation,
                        event: MetaMetricsEventName.AccountAddSelected,
                        properties: {
                          account_type: MetaMetricsEventAccountType.Snap,
                          snap_id: SOLANA_WALLET_SNAP_ID,
                          snap_name: SOLANA_WALLET_NAME,
                          location: 'Main Menu',
                        },
                      });

                      // The account creation + renaming is handled by the
                      // Snap account bridge, so we need to close the current
                      // modal
                      onClose();

                      await solanaWalletSnapClient.createAccount(
                        MultichainNetworks.SOLANA,
                      );
                    }}
                    data-testid="multichain-account-menu-popover-add-solana-account"
                  >
                    {t('addNewSolanaAccount')}
                  </ButtonLink>
                </Box>
              )
              ///: END:ONLY_INCLUDE_IF
            }
            <Box marginTop={4}>
              <ButtonLink
                size={ButtonLinkSize.Sm}
                startIconName={IconName.Import}
                data-testid="multichain-account-menu-popover-add-imported-account"
                onClick={() => {
                  trackEvent({
                    category: MetaMetricsEventCategory.Navigation,
                    event: MetaMetricsEventName.AccountAddSelected,
                    properties: {
                      account_type: MetaMetricsEventAccountType.Imported,
                      location: 'Main Menu',
                    },
                  });
                  setActionMode(ACTION_MODES.IMPORT);
                }}
              >
                {t('importAccount')}
              </ButtonLink>
            </Box>
            <Box marginTop={4}>
              <ButtonLink
                size={ButtonLinkSize.Sm}
                startIconName={IconName.Hardware}
                onClick={() => {
                  onClose();
                  trackEvent({
                    category: MetaMetricsEventCategory.Navigation,
                    event: MetaMetricsEventName.AccountAddSelected,
                    properties: {
                      account_type: MetaMetricsEventAccountType.Hardware,
                      location: 'Main Menu',
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
                {t('addHardwareWallet')}
              </ButtonLink>
            </Box>
            {
              ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
              addSnapAccountEnabled ? (
                <Box marginTop={4}>
                  <ButtonLink
                    size={ButtonLinkSize.Sm}
                    startIconName={IconName.Snaps}
                    onClick={() => {
                      onClose();
                      trackEvent({
                        category: MetaMetricsEventCategory.Navigation,
                        event: MetaMetricsEventName.AccountAddSelected,
                        properties: {
                          account_type: MetaMetricsEventAccountType.Snap,
                          location: 'Main Menu',
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
              ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
              <Box marginTop={4}>
                <ButtonLink
                  size={ButtonLinkSize.Sm}
                  startIconName={IconName.Custody}
                  onClick={() => {
                    onClose();
                    trackEvent({
                      category: MetaMetricsEventCategory.Navigation,
                      event:
                        MetaMetricsEventName.ConnectCustodialAccountClicked,
                    });
                    if (getEnvironmentType() === ENVIRONMENT_TYPE_POPUP) {
                      global.platform.openExtensionInBrowser?.(
                        CUSTODY_ACCOUNT_ROUTE,
                      );
                    } else {
                      history.push(CUSTODY_ACCOUNT_ROUTE);
                    }
                  }}
                >
                  {t('connectCustodialAccountMenu')}
                </ButtonLink>
              </Box>
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
                    onClick={handleAddWatchAccount}
                    data-testid="multichain-account-menu-popover-add-watch-only-account"
                  >
                    {t('addEthereumWatchOnlyAccount')}
                  </ButtonLink>
                </Box>
              )
              ///: END:ONLY_INCLUDE_IF
            }
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
                  // TODO: These props are required in the TextFieldSearch component. These should be optional
                  endAccessory
                  className
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
              {searchResults.map((account) => {
                const connectedSite = connectedSites[account.address]?.find(
                  ({ origin }) => origin === currentTabOrigin,
                );

                const hideAccountListItem =
                  searchQuery.length === 0 && account.hidden;

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
                      onClick={onAccountListItemItemClicked(account)}
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
              })}
            </Box>
            {/* Hidden Accounts, this component shows hidden accounts in account list Item*/}
            {hiddenAddresses.length > 0 ? (
              <HiddenAccountList onClose={onClose} />
            ) : null}
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
