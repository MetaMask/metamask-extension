import React, { useContext, useMemo } from 'react';

import {
  AccountGroupId,
  AccountWalletId,
  AccountWalletType,
} from '@metamask/account-api';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { Box, Text } from '../../component-library';

import {
  AlignItems,
  Display,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { MultichainAccountCell } from '../multichain-account-cell';
import { AccountTreeWallets } from '../../../selectors/multichain-accounts/account-tree.types';
import { setSelectedMultichainAccount } from '../../../store/actions';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { endTrace, trace } from '../../../../shared/lib/trace';
import {
  ACCOUNT_OVERVIEW_TAB_KEY_TO_TRACE_NAME_MAP,
  AccountOverviewTabKey,
} from '../../../../shared/constants/app-state';
import {
  getDefaultHomeActiveTabName,
  getHDEntropyIndex,
} from '../../../selectors';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { MultichainAccountMenu } from '../multichain-account-menu';
import { AddMultichainAccount } from '../add-multichain-account';

export type MultichainAccountListProps = {
  wallets: AccountTreeWallets;
  selectedAccountGroup: AccountGroupId;
};

export const MultichainAccountList = ({
  wallets,
  selectedAccountGroup,
}: MultichainAccountListProps) => {
  const dispatch = useDispatch();
  const history = useHistory();
  const trackEvent = useContext(MetaMetricsContext);
  const defaultHomeActiveTabName: AccountOverviewTabKey = useSelector(
    getDefaultHomeActiveTabName,
  );
  const hdEntropyIndex = useSelector(getHDEntropyIndex);

  const walletTree = useMemo(() => {
    const handleAccountClick = (accountGroupId: AccountGroupId) => {
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

      dispatch(setSelectedMultichainAccount(accountGroupId));
      history.push(DEFAULT_ROUTE);
    };

    return Object.entries(wallets).reduce(
      (walletsAccumulator, [walletId, walletData]) => {
        const walletName = walletData.metadata?.name;

        const walletHeader = (
          <Box
            key={`wallet-header-${walletId}`}
            data-testid="multichain-account-tree-wallet-header"
            display={Display.Flex}
            justifyContent={JustifyContent.spaceBetween}
            alignItems={AlignItems.center}
            paddingLeft={4}
            paddingRight={4}
            paddingTop={2}
            paddingBottom={2}
          >
            <Text
              variant={TextVariant.bodyMdMedium}
              color={TextColor.textMuted}
              style={{ fontWeight: '600' }}
            >
              {walletName}
            </Text>
          </Box>
        );

        const groupsItems = Object.entries(walletData.groups || {}).flatMap(
          ([groupId, groupData]) => {
            // TODO: Implement logic for removable accounts
            const isRemovable = false;

            return [
              <MultichainAccountCell
                key={`multichain-account-cell-${groupId}`}
                accountId={groupId as AccountGroupId}
                accountName={groupData.metadata.name}
                balance="$ n/a"
                selected={selectedAccountGroup === groupId}
                onClick={handleAccountClick}
                endAccessory={
                  <MultichainAccountMenu
                    accountGroupId={groupId as AccountGroupId}
                    isRemovable={isRemovable}
                  />
                }
              />,
            ];
          },
        );

        if (walletData.type === AccountWalletType.Entropy) {
          groupsItems.push(
            <AddMultichainAccount
              walletId={walletId as AccountWalletId}
              key={`add-multichain-account-${walletId}`}
            />,
          );
        }

        return [...walletsAccumulator, walletHeader, ...groupsItems];
      },
      [] as React.ReactNode[],
    );
  }, [
    wallets,
    trackEvent,
    hdEntropyIndex,
    defaultHomeActiveTabName,
    dispatch,
    history,
    selectedAccountGroup,
  ]);

  return <>{walletTree}</>;
};
