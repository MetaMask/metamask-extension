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
  KeyringAccountType,
  ///: END:ONLY_INCLUDE_IF
} from '@metamask/keyring-api';
import { CaipChainId } from '@metamask/utils';
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
  ///: BEGIN:ONLY_INCLUDE_IF(multi-srp,solana)
  getHdKeyringOfSelectedAccountOrPrimaryKeyring,
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
import {
  hasCreatedBtcMainnetAccount,
  hasCreatedBtcTestnetAccount,
} from '../../../selectors/accounts';
///: END:ONLY_INCLUDE_IF

///: BEGIN:ONLY_INCLUDE_IF(multichain)
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
import { CreateEthAccount } from '../create-eth-account';
import { CreateSnapAccount } from '../create-snap-account';
import { ImportAccount } from '../import-account';
///: BEGIN:ONLY_INCLUDE_IF(solana)
import {
  SOLANA_WALLET_NAME,
  SOLANA_WALLET_SNAP_ID,
} from '../../../../shared/lib/accounts/solana-wallet-snap';
///: END:ONLY_INCLUDE_IF
///: BEGIN:ONLY_INCLUDE_IF(multi-srp)
import { ImportSrp } from '../multi-srp/import-srp';
import { SrpList } from '../multi-srp/srp-list';
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
  ///: BEGIN:ONLY_INCLUDE_IF(solana)
  // Displays the add account form controls (for solana account)
  ADD_SOLANA: 'add-solana',
  ///: END:ONLY_INCLUDE_IF
  // Displays the import account form controls
  IMPORT: 'import',
  ///: BEGIN:ONLY_INCLUDE_IF(multi-srp)
  CREATE_SRP: 'create-srp',
  IMPORT_SRP: 'import-srp',
  SELECT_SRP: 'select-srp',
  ///: END:ONLY_INCLUDE_IF
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
    ///: BEGIN:ONLY_INCLUDE_IF(solana)
    case ACTION_MODES.ADD_SOLANA:
      return t('addAccount');
    ///: END:ONLY_INCLUDE_IF
    case ACTION_MODES.IMPORT:
      return t('importPrivateKey');
    ///: BEGIN:ONLY_INCLUDE_IF(multi-srp)
    case ACTION_MODES.CREATE_SRP:
      return t('createSecretRecoveryPhrase');
    case ACTION_MODES.IMPORT_SRP:
      return t('importSecretRecoveryPhrase');
    case ACTION_MODES.SELECT_SRP:
      return t('addAccount');
    ///: END:ONLY_INCLUDE_IF
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
  const [searchQuery, setSearchQuery] = useState('');
  const [actionMode, setActionMode] = useState(ACTION_MODES.LIST);
  ///: BEGIN:ONLY_INCLUDE_IF(multi-srp)
  const [previousActionMode, setPreviousActionMode] = useState(
    ACTION_MODES.LIST,
  );
  ///: END:ONLY_INCLUDE_IF(multi-srp)
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

    // TODO: Forward the `primaryKeyring.metadata.id` to Bitcoin once supported.
    await bitcoinWalletSnapClient.createAccount(network);
  };
  ///: END:ONLY_INCLUDE_IF

  ///: BEGIN:ONLY_INCLUDE_IF(solana)
  const solanaSupportEnabled = useSelector(getIsSolanaSupportEnabled);
  ///: END:ONLY_INCLUDE_IF
  ///: BEGIN:ONLY_INCLUDE_IF(multi-srp)

  // Here we are getting the keyring of the last selected account
  // if it is not an hd keyring, we will use the primary keyring
  const hdKeyring = useSelector(getHdKeyringOfSelectedAccountOrPrimaryKeyring);
  const [selectedKeyringId, setSelectedKeyringId] = useState(
    hdKeyring.metadata.id,
  );
  ///: END:ONLY_INCLUDE_IF

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

  const title = useMemo(
    () => getActionTitle(t as (text: string) => string, actionMode),
    [actionMode, t],
  );

  // eslint-disable-next-line no-empty-function
  let onBack;
  if (actionMode !== ACTION_MODES.LIST) {
    if (actionMode === ACTION_MODES.MENU) {
      onBack = () => setActionMode(ACTION_MODES.LIST);
      ///: BEGIN:ONLY_INCLUDE_IF(multi-srp)
    } else if (actionMode === ACTION_MODES.SELECT_SRP) {
      onBack = () => setActionMode(previousActionMode);
      ///: END:ONLY_INCLUDE_IF
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

  /**
   * Helper function to determine the client type and chain ID based on action mode
   *
   * @param mode - The current action mode
   * @returns An object containing the client type and chain ID, or null values if not a snap account creation mode
   */
  const getSnapClientConfig = (
    mode: string,
  ): { clientType: WalletClientType | null; chainId: CaipChainId | null } => {
    switch (mode) {
      case ACTION_MODES.ADD_BITCOIN:
        return {
          clientType: WalletClientType.Bitcoin,
          chainId: MultichainNetworks.BITCOIN,
        };
      case ACTION_MODES.ADD_BITCOIN_TESTNET:
        return {
          clientType: WalletClientType.Bitcoin,
          chainId: MultichainNetworks.BITCOIN_TESTNET,
        };
      case ACTION_MODES.ADD_SOLANA:
        return {
          clientType: WalletClientType.Solana,
          chainId: MultichainNetworks.SOLANA,
        };
      default:
        return {
          clientType: null,
          chainId: null,
        };
    }
  };

  // Use the helper function to get client type and chain ID
  const { clientType, chainId } = getSnapClientConfig(actionMode);

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
              onActionComplete={onActionComplete}
              ///: BEGIN:ONLY_INCLUDE_IF(multi-srp)
              selectedKeyringId={selectedKeyringId}
              onSelectSrp={() => {
                setPreviousActionMode(ACTION_MODES.ADD);
                setActionMode(ACTION_MODES.SELECT_SRP);
              }}
              ///: END:ONLY_INCLUDE_IF(multi-srp)
            />
          </Box>
        ) : null}
        {clientType && chainId ? (
          <Box paddingLeft={4} paddingRight={4} paddingBottom={4}>
            <CreateSnapAccount
              onActionComplete={onActionComplete}
              selectedKeyringId={selectedKeyringId}
              onSelectSrp={() => {
                ///: BEGIN:ONLY_INCLUDE_IF(multi-srp)
                setPreviousActionMode(actionMode);
                ///: END:ONLY_INCLUDE_IF(multi-srp)
                setActionMode(ACTION_MODES.SELECT_SRP);
              }}
              clientType={clientType}
              chainId={chainId}
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
            <ImportAccount onActionComplete={onActionComplete} />
          </Box>
        ) : null}
        {
          ///: BEGIN:ONLY_INCLUDE_IF(multi-srp)
          actionMode === ACTION_MODES.IMPORT_SRP && (
            <Box
              paddingLeft={4}
              paddingRight={4}
              paddingBottom={4}
              paddingTop={0}
              style={{ overflowY: 'scroll' }}
            >
              <ImportSrp onActionComplete={onActionComplete} />
            </Box>
          )
          ///: END:ONLY_INCLUDE_IF
        }
        {
          ///: BEGIN:ONLY_INCLUDE_IF(multi-srp)
          actionMode === ACTION_MODES.SELECT_SRP && (
            <SrpList
              onActionComplete={(keyringId: string) => {
                setSelectedKeyringId(keyringId);
                setActionMode(previousActionMode);
              }}
            />
          )
          ///: END:ONLY_INCLUDE_IF
        }

        {/* Add / Import / Hardware Menu */}
        {actionMode === ACTION_MODES.MENU ? (
          <Box padding={4}>
            <Text
              variant={TextVariant.bodySmMedium}
              marginBottom={4}
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
                      setActionMode(ACTION_MODES.ADD_SOLANA);
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
              ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
              bitcoinSupportEnabled && (
                <Box marginTop={4}>
                  <ButtonLink
                    disabled={isBtcMainnetAccountAlreadyCreated}
                    size={ButtonLinkSize.Sm}
                    startIconName={IconName.Add}
                    startIconProps={{ size: IconSize.Md }}
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
                    {t('addBitcoinAccountLabel')}
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
                    startIconProps={{ size: IconSize.Md }}
                    onClick={async () => {
                      await handleAccountCreation(
                        MultichainNetworks.BITCOIN_TESTNET,
                      );
                    }}
                    data-testid="multichain-account-menu-popover-add-btc-account-testnet"
                  >
                    {t('addBitcoinTestnetAccountLabel')}
                  </ButtonLink>
                </Box>
              ) : null
              ///: END:ONLY_INCLUDE_IF
            }
            <Text
              variant={TextVariant.bodySmMedium}
              marginTop={4}
              marginBottom={4}
              color={TextColor.textAlternative}
            >
              {t('importWalletOrAccountHeader')}
            </Text>
            {
              ///: BEGIN:ONLY_INCLUDE_IF(multi-srp)
              <Box marginTop={4}>
                <ButtonLink
                  size={ButtonLinkSize.Sm}
                  startIconName={IconName.Wallet}
                  startIconProps={{ size: IconSize.Md }}
                  onClick={() => {
                    setActionMode(ACTION_MODES.IMPORT_SRP);
                  }}
                  data-testid="multichain-account-menu-popover-import-srp"
                >
                  {t('secretRecoveryPhrase')}
                </ButtonLink>
              </Box>
              ///: END:ONLY_INCLUDE_IF
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
              marginBottom={4}
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
