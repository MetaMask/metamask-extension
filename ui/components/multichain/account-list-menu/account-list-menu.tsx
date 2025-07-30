import React, {
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
} from 'react';
import Fuse from 'fuse.js';
import { useDispatch, useSelector } from 'react-redux';
import {
  BtcAccountType,
  EthAccountType,
  SolAccountType,
  KeyringAccountType,
  TrxAccountType,
} from '@metamask/keyring-api';
import {
  Box,
  ButtonIconSize,
  Text,
  TextFieldSearch,
  TextFieldSearchSize,
} from '../../component-library';
import { AccountListItem } from '../account-list-item';
import { AccountListItemMenuTypes } from '../account-list-item/account-list-item.types';

import {
  BlockSize,
  Display,
  TextColor,
} from '../../../helpers/constants/design-system';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  getConnectedSubjectsForAllAddresses,
  getMetaMaskAccountsOrdered,
  getOriginOfCurrentTab,
  getSelectedInternalAccount,
  getHDEntropyIndex,
  getAllChainsToPoll,
  getDefaultHomeActiveTabName,
  getUpdatedAndSortedAccounts,
  getHiddenAccountsList,
} from '../../../selectors';
import { detectNfts, setSelectedAccount } from '../../../store/actions';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';

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
import { AccountMenu } from '../account-menu';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { HiddenAccountList } from './hidden-account-list';

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
    BtcAccountType.P2pkh,
    BtcAccountType.P2sh,
    BtcAccountType.P2wpkh,
    BtcAccountType.P2tr,
    SolAccountType.DataAccount,
    TrxAccountType.Eoa,
  ],
}: AccountListMenuProps) => {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
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
  const hiddenAddresses = useSelector(getHiddenAccountsList);
  const updatedAccountsList = useSelector(getUpdatedAndSortedAccounts);
  const filteredUpdatedAccountList = useMemo(
    () =>
      updatedAccountsList.filter((account) =>
        allowedAccountTypes.includes(account.type),
      ),
    [updatedAccountsList, allowedAccountTypes],
  );
  const allChainIds = useSelector(getAllChainsToPoll);
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const connectedSites = useSelector(
    getConnectedSubjectsForAllAddresses,
  ) as AccountConnections;
  const currentTabOrigin = useSelector(getOriginOfCurrentTab);
  const dispatch = useDispatch();

  const [searchQuery, setSearchQuery] = useState('');

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

  const defaultHomeActiveTabName: AccountOverviewTabKey = useSelector(
    getDefaultHomeActiveTabName,
  );

  const onAccountListItemItemClicked = useCallback(
    (account: MergedInternalAccount) => {
      onClose();
      trackEvent({
        category: MetaMetricsEventCategory.Navigation,
        event: MetaMetricsEventName.NavAccountSwitched,
        properties: {
          location: 'Main Menu',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
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

  return (
    <AccountMenu onClose={onClose} showAccountCreation={showAccountCreation}>
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
              size={TextFieldSearchSize.Sm}
              width={BlockSize.Full}
              placeholder={t('searchAccounts')}
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchQuery(e.target.value)
              }
              clearButtonOnClick={() => setSearchQuery('')}
              clearButtonProps={{
                size: ButtonIconSize.Sm,
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
      </>
    </AccountMenu>
  );
};
