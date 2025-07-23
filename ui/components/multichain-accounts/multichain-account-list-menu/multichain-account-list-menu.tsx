import React, { useState, useCallback, useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  BtcAccountType,
  EthAccountType,
  KeyringAccountType,
  SolAccountType,
} from '@metamask/keyring-api';

import { Box, TextFieldSearchSize } from '../../component-library';
import { TextFieldSearch } from '../../component-library/text-field-search/text-field-search';
import { BlockSize } from '../../../helpers/constants/design-system';

import { useI18nContext } from '../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  getAllChainsToPoll,
  getConnectedSubjectsForAllAddresses,
  getDefaultHomeActiveTabName,
  getHDEntropyIndex,
  getOriginOfCurrentTab,
  getSelectedInternalAccount,
} from '../../../selectors';
import { detectNfts, setSelectedAccount } from '../../../store/actions';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import {
  AccountConnections,
  MergedInternalAccount,
} from '../../../selectors/selectors.types';
import { endTrace, trace, TraceName } from '../../../../shared/lib/trace';
import {
  ACCOUNT_OVERVIEW_TAB_KEY_TO_TRACE_NAME_MAP,
  AccountOverviewTabKey,
} from '../../../../shared/constants/app-state';
import { getWalletsWithAccounts } from '../../../selectors/multichain-accounts/account-tree';
import { MultichainAccountsTree } from '../multichain-accounts-tree';
import { AccountMenu } from '../../multichain/account-menu';

export type MultichainAccountListMenuProps = {
  onClose: () => void;
  privacyMode?: boolean;
  showAccountCreation?: boolean;
  accountListItemProps?: Record<string, unknown>;
  allowedAccountTypes?: KeyringAccountType[];
};

export const MultichainAccountListMenu = ({
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
  ],
}: MultichainAccountListMenuProps) => {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const hdEntropyIndex = useSelector(getHDEntropyIndex);
  useEffect(() => {
    endTrace({ name: TraceName.AccountList });
  }, []);
  const allChainIds = useSelector(getAllChainsToPoll);
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const connectedSites = useSelector(
    getConnectedSubjectsForAllAddresses,
  ) as AccountConnections;
  const currentTabOrigin = useSelector(getOriginOfCurrentTab);
  const dispatch = useDispatch();

  const walletAccountCollection = useSelector(getWalletsWithAccounts);
  const defaultHomeActiveTabName: AccountOverviewTabKey = useSelector(
    getDefaultHomeActiveTabName,
  );
  const [searchPattern, setSearchPattern] = useState<string>('');

  // Here we are getting the keyring of the last selected account
  // if it is not an hd keyring, we will use the primary keyring
  const onAccountTreeItemClick = useCallback(
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

  const onSearchBarChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setSearchPattern(e.target.value),
    [],
  );

  return (
    <AccountMenu onClose={onClose} showAccountCreation={showAccountCreation}>
      <Box paddingLeft={4} paddingRight={4} paddingBottom={4} paddingTop={0}>
        <TextFieldSearch
          size={TextFieldSearchSize.Sm}
          width={BlockSize.Full}
          placeholder={t('search')}
          value={searchPattern}
          onChange={onSearchBarChange}
          clearButtonOnClick={() => setSearchPattern('')}
          data-testid="multichain-account-menu-search-bar"
        />
      </Box>
      {/* Account tree block */}
      <Box className="multichain-account-menu-popover__list">
        <MultichainAccountsTree
          wallets={walletAccountCollection}
          allowedAccountTypes={allowedAccountTypes}
          connectedSites={connectedSites}
          currentTabOrigin={currentTabOrigin}
          privacyMode={privacyMode}
          accountTreeItemProps={accountListItemProps}
          searchPattern={searchPattern}
          selectedAccount={selectedAccount}
          onClose={onClose}
          onAccountTreeItemClick={onAccountTreeItemClick}
        />
      </Box>
    </AccountMenu>
  );
};
