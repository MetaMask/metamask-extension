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
import { SendPageRow } from '.';

type SendPageYourAccountsProps = {
  allowedAccountTypes?: KeyringAccountType[];
};

const defaultAllowedAccountTypes = [EthAccountType.Eoa, EthAccountType.Erc4337];

const AccountListItemContainer = React.memo(
  (props: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    account: any;
    selectedAccount: InternalAccount;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dispatch: Dispatch<any>;
    trackEvent: UITrackEventMethod;
  }) => {
    const { account, selectedAccount, dispatch, trackEvent } = props;

    const onClick = useCallback(() => {
      dispatch(
        addHistoryEntry(
          `sendFlow - User clicked recipient from my accounts. address: ${account.address}, nickname ${account.name}`,
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
          nickname: account.name,
        }),
      );
      dispatch(updateRecipientUserInput(account.address));
    }, [account.address, account.name, dispatch, trackEvent]);

    return (
      <AccountListItem
        account={account}
        selected={selectedAccount.address === account.address}
        isPinned={Boolean(account.pinned)}
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
  const filteredAccounts = useMemo(() => {
    return accounts.filter((account: InternalAccount) =>
      allowedAccountTypes.includes(account.type),
    );
  }, [accounts, allowedAccountTypes]);
  const selectedAccount = useSelector(getSelectedInternalAccount);

  return (
    <SendPageRow>
      {/* TODO: Replace `any` with type */}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {filteredAccounts.map((account: any) => (
        <AccountListItemContainer
          key={account.address}
          account={account}
          selectedAccount={selectedAccount}
          dispatch={dispatch}
          trackEvent={trackEvent}
        />
      ))}
    </SendPageRow>
  );
};
