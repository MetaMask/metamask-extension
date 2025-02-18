import React, { useCallback, useContext, useMemo } from 'react';
import type { Dispatch } from 'redux';
import { useDispatch, useSelector } from 'react-redux';
import { EthAccountType, KeyringAccountType } from '@metamask/keyring-api';
import { InternalAccount } from '@metamask/keyring-internal-api';
import {
  getUpdatedAndSortedAccounts,
  getSelectedInternalAccount,
} from '../../../../../selectors';
import { AccountListItem } from '../../..';
import {
  addHistoryEntry,
  updateRecipient,
  updateRecipientUserInput,
} from '../../../../../ducks/send';
import {
  MetaMetricsContext,
  type UITrackEventMethod,
} from '../../../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../../shared/constants/metametrics';
import { useVirtualList } from '../../../../../hooks/useVirtualList';
import { SendPageRow } from '.';

type SendPageYourAccountsProps = {
  allowedAccountTypes?: KeyringAccountType[];
};

const defaultAllowedAccountTypes = [EthAccountType.Eoa, EthAccountType.Erc4337];

const AccountListItemContainer = React.memo(
  (props: {
    account: InternalAccount;
    selectedAccount: InternalAccount;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dispatch: Dispatch<any>;
    trackEvent: UITrackEventMethod;
  }) => {
    const { account, selectedAccount, dispatch, trackEvent } = props;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const looseTypedAccount = account as any;

    const onClick = useCallback(() => {
      dispatch(
        addHistoryEntry(
          `sendFlow - User clicked recipient from my accounts. address: ${account.address}, nickname ${looseTypedAccount.name}`,
        ),
      );
      trackEvent(
        {
          event: MetaMetricsEventName.sendRecipientSelected,
          category: MetaMetricsEventCategory.Send,
          properties: {
            location: 'my accounts',
            inputType: 'click',
          },
        },
        { excludeMetaMetricsId: false },
      );
      dispatch(
        updateRecipient({
          address: account.address,
          nickname: looseTypedAccount.name,
        }),
      );
      dispatch(updateRecipientUserInput(account.address));
    }, [dispatch, account.address, trackEvent, looseTypedAccount.name]);

    return (
      <AccountListItem
        account={looseTypedAccount}
        selected={selectedAccount.address === account.address}
        isPinned={Boolean(looseTypedAccount.pinned)}
        shouldScrollToWhenSelected={false}
        onClick={onClick}
      />
    );
  },
);

export const SendPageYourAccounts = ({
  allowedAccountTypes = defaultAllowedAccountTypes,
}: SendPageYourAccountsProps) => {
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);

  // Your Accounts
  const accounts = useSelector(getUpdatedAndSortedAccounts);
  const filteredAccounts: InternalAccount[] = useMemo(() => {
    return accounts.filter((account: InternalAccount) =>
      allowedAccountTypes.includes(account.type),
    );
  }, [accounts, allowedAccountTypes]);
  const selectedAccount = useSelector(getSelectedInternalAccount);

  const { VirtualList } = useVirtualList({
    items: filteredAccounts,
    estimatedSize: 80, // 80px
    getKey: (account) => account.address,
  });

  return (
    <SendPageRow>
      <VirtualList>
        {(account) => (
          <AccountListItemContainer
            account={account}
            selectedAccount={selectedAccount}
            dispatch={dispatch}
            trackEvent={trackEvent}
          />
        )}
      </VirtualList>
    </SendPageRow>
  );
};
