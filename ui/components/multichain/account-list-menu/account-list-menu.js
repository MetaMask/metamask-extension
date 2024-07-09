import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import Fuse from 'fuse.js';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  ButtonLink,
  ButtonSecondary,
  ButtonSecondarySize,
  ButtonVariant,
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
  CreateEthAccount,
  ImportAccount,
  AccountListItemMenuTypes,
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  CreateBtcAccount,
  ///: END:ONLY_INCLUDE_IF
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
  getMetaMaskAccountsOrdered,
  getConnectedSubjectsForAllAddresses,
  getOriginOfCurrentTab,
  getUpdatedAndSortedAccounts,
  getHiddenAccountsList,
  getSelectedInternalAccount,
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  getIsAddSnapAccountEnabled,
  ///: END:ONLY_INCLUDE_IF
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  getIsBitcoinSupportEnabled,
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
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  CUSTODY_ACCOUNT_ROUTE,
  ///: END:ONLY_INCLUDE_IF
} from '../../../helpers/constants/routes';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_POPUP } from '../../../../shared/constants/app';
import { getAccountLabel } from '../../../helpers/utils/accounts';
///: BEGIN:ONLY_INCLUDE_IF(build-flask)
import { hasCreatedBtcMainnetAccount } from '../../../selectors/accounts';
///: END:ONLY_INCLUDE_IF
import { HiddenAccountList } from './hidden-account-list';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';

const ACTION_MODES = {
  // Displays the search box and account list
  LIST: '',
  // Displays the Add, Import, Hardware accounts
  MENU: 'menu',
  // Displays the add account form controls
  ADD: 'add',
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
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
export const getActionTitle = (t, actionMode) => {
  switch (actionMode) {
    case ACTION_MODES.ADD:
      return t('addAccount');
    ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
    case ACTION_MODES.ADD_BITCOIN:
      return t('addAccount');
    case ACTION_MODES.ADD_BITCOIN_TESTNET:
      return t('addAccount');
    ///: END:ONLY_INCLUDE_IF
    case ACTION_MODES.MENU:
      return t('addAccount');
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
export const mergeAccounts = (accountsWithBalances, internalAccounts) => {
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

export const AccountListMenu = ({
  onClose,
  showAccountCreation = true,
  accountListItemProps = {},
}) => {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const accounts = useSelector(getMetaMaskAccountsOrdered);
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const connectedSites = useSelector(getConnectedSubjectsForAllAddresses);
  const currentTabOrigin = useSelector(getOriginOfCurrentTab);
  const history = useHistory();
  const dispatch = useDispatch();
  const hiddenAddresses = useSelector(getHiddenAccountsList);
  const updatedAccountsList = useSelector(getUpdatedAndSortedAccounts);
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  const addSnapAccountEnabled = useSelector(getIsAddSnapAccountEnabled);
  ///: END:ONLY_INCLUDE_IF
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  const bitcoinSupportEnabled = useSelector(getIsBitcoinSupportEnabled);
  const isBtcMainnetAccountAlreadyCreated = useSelector(
    hasCreatedBtcMainnetAccount,
  );
  ///: END:ONLY_INCLUDE_IF

  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  const isBtcTestnetEnabled = true; // TODO: Use a feature flag for this?
  ///: END:ONLY_INCLUDE_IF

  const [searchQuery, setSearchQuery] = useState('');
  const [actionMode, setActionMode] = useState(ACTION_MODES.LIST);

  let searchResults = updatedAccountsList;
  if (searchQuery) {
    const fuse = new Fuse(accounts, {
      threshold: 0.2,
      location: 0,
      distance: 100,
      maxPatternLength: 32,
      minMatchCharLength: 1,
      keys: ['metadata.name', 'address'],
    });
    fuse.setCollection(accounts);
    searchResults = fuse.search(searchQuery);
  }
  searchResults = mergeAccounts(searchResults, accounts);

  const title = getActionTitle(t, actionMode);

  let onBack = null;
  if (actionMode !== ACTION_MODES.LIST) {
    if (actionMode === ACTION_MODES.MENU) {
      onBack = () => setActionMode(ACTION_MODES.LIST);
    } else {
      onBack = () => setActionMode(ACTION_MODES.MENU);
    }
  }

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
        {
          // Bitcoin mainnet:
          ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
          bitcoinSupportEnabled && actionMode === ACTION_MODES.ADD_BITCOIN ? (
            <Box paddingLeft={4} paddingRight={4} paddingBottom={4}>
              <CreateBtcAccount
                defaultAccountName='Bitcoin Account'
                network={MultichainNetworks.BITCOIN}
                onActionComplete={(confirmed) => {
                  if (confirmed) {
                    onClose();
                  } else {
                    setActionMode(ACTION_MODES.LIST);
                  }
                }}
              />
            </Box>
          ) : null
          ///: END:ONLY_INCLUDE_IF
        }
        {
          // Bitcoin testnet:
          ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
          isBtcTestnetEnabled && actionMode === ACTION_MODES.ADD_BITCOIN_TESTNET ? (
            <Box paddingLeft={4} paddingRight={4} paddingBottom={4}>
              <CreateBtcAccount
                defaultAccountName='Bitcoin Testnet Account'
                network={MultichainNetworks.BITCOIN_TESTNET}
                onActionComplete={(confirmed) => {
                  if (confirmed) {
                    onClose();
                  } else {
                    setActionMode(ACTION_MODES.LIST);
                  }
                }}
              />
            </Box>
          ) : null
          ///: END:ONLY_INCLUDE_IF
        }
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
                size={Size.SM}
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
              bitcoinSupportEnabled ? (
                <Box marginTop={4}>
                  <ButtonLink
                    disabled={isBtcMainnetAccountAlreadyCreated}
                    size={Size.SM}
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
                      setActionMode(ACTION_MODES.ADD_BITCOIN);
                    }}
                    data-testid="multichain-account-menu-popover-add-account"
                  >
                    {t('addNewBitcoinAccount')}
                  </ButtonLink>
                </Box>
              ) : null
              ///: END:ONLY_INCLUDE_IF
            }
            {
              ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
              <Box marginTop={4}>
                <ButtonLink
                  size={Size.SM}
                  startIconName={IconName.Add}
                  onClick={() => {
                    setActionMode(ACTION_MODES.ADD_BITCOIN_TESTNET);
                  }}
                  data-testid="multichain-account-menu-popover-add-account-testnet"
                >
                  {t('addNewBitcoinTestnetAccount')}
                </ButtonLink>
              </Box>
              ///: END:ONLY_INCLUDE_IF
            }
            <Box marginTop={4}>
              <ButtonLink
                size={Size.SM}
                startIconName={IconName.Import}
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
                size={Size.SM}
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
                    global.platform.openExtensionInBrowser(
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
                    size={Size.SM}
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
                        url: process.env.ACCOUNT_SNAPS_DIRECTORY_URL,
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
                  size={Size.SM}
                  startIconName={IconName.Custody}
                  onClick={() => {
                    onClose();
                    trackEvent({
                      category: MetaMetricsEventCategory.Navigation,
                      event:
                        MetaMetricsEventName.ConnectCustodialAccountClicked,
                    });
                    if (getEnvironmentType() === ENVIRONMENT_TYPE_POPUP) {
                      global.platform.openExtensionInBrowser(
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
          </Box>
        ) : null}
        {actionMode === ACTION_MODES.LIST ? (
          <>
            {/* Search box */}
            {accounts.length > 1 ? (
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
                  onChange={(e) => setSearchQuery(e.target.value)}
                  clearButtonOnClick={() => setSearchQuery('')}
                  clearButtonProps={{
                    size: Size.SM,
                  }}
                  inputProps={{ autoFocus: true }}
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
                      onClick={() => {
                        onClose();
                        trackEvent({
                          category: MetaMetricsEventCategory.Navigation,
                          event: MetaMetricsEventName.NavAccountSwitched,
                          properties: {
                            location: 'Main Menu',
                          },
                        });
                        dispatch(setSelectedAccount(account.address));
                      }}
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
                  variant={ButtonVariant.Secondary}
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
};
