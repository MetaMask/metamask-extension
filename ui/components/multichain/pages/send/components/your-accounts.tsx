import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getUpdatedAndSortedAccounts,
  getInternalAccounts,
} from '../../../../../selectors';
import { AccountListItem } from '../../..';
import {
  addHistoryEntry,
  updateRecipient,
  updateRecipientUserInput,
} from '../../../../../ducks/send';
import { mergeAccounts } from '../../../account-list-menu/account-list-menu';
import { MetaMetricsContext } from '../../../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../../shared/constants/metametrics';
import { SendPageRow } from '.';

export const SendPageYourAccounts = () => {
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);

  // Your Accounts
  const accounts = useSelector(getUpdatedAndSortedAccounts);
  const internalAccounts = useSelector(getInternalAccounts);
  const mergedAccounts = mergeAccounts(accounts, internalAccounts);

  return (
    <SendPageRow>
      {/* TODO: Replace `any` with type */}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {mergedAccounts.map((account: any) => (
        <AccountListItem
          account={account}
          key={account.address}
          isPinned={Boolean(account.pinned)}
          onClick={() => {
            dispatch(
              addHistoryEntry(
                `sendFlow - User clicked recipient from my accounts. address: ${account.address}, nickname ${account.name}`,
              ),
            );
            trackEvent({
              event: MetaMetricsEventName.sendRecipientSelected,
              category: MetaMetricsEventCategory.Send,
              properties: {
                location: 'my accounts',
                inputType: 'click',
              },
            });
            dispatch(
              updateRecipient({
                address: account.address,
                nickname: account.name,
              }),
            );
            dispatch(updateRecipientUserInput(account.address));
          }}
        />
      ))}
    </SendPageRow>
  );
};
