import React, { useCallback, useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  BtcAccountType,
  EthAccountType,
  KeyringAccountType,
  SolAccountType,
} from '@metamask/keyring-api';

import { Box } from '../../component-library';

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

  return (
    <AccountMenu onClose={onClose} showAccountCreation={showAccountCreation}>
      {/* Account tree block */}
      <Box className="multichain-account-menu-popover__list">
        <MultichainAccountsTree
          wallets={walletAccountCollection}
          allowedAccountTypes={allowedAccountTypes}
          connectedSites={connectedSites}
          currentTabOrigin={currentTabOrigin}
          privacyMode={privacyMode}
          accountTreeItemProps={accountListItemProps}
          selectedAccount={selectedAccount}
          onClose={onClose}
          onAccountTreeItemClick={onAccountTreeItemClick}
        />
      </Box>
    </AccountMenu>
  );
};
