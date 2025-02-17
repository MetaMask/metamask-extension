import React, { useCallback, useContext, useMemo, useRef } from 'react';
import type { Dispatch } from 'redux';
import { useDispatch, useSelector } from 'react-redux';
import { EthAccountType, KeyringAccountType } from '@metamask/keyring-api';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { useVirtualizer } from '@tanstack/react-virtual';
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
import { Box } from '../../../../component-library';
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

  const rootRef = useRef(
    document.getElementsByClassName('app').item(0) as HTMLDivElement,
  );
  const virtualizer = useVirtualizer({
    count: filteredAccounts.length,
    estimateSize: () => 80,
    getScrollElement: () => rootRef.current,
  });
  const items = virtualizer.getVirtualItems();

  return (
    <SendPageRow ref={rootRef}>
      <Box
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {items.map((virtualItem) => {
          const account = filteredAccounts[virtualItem.index] ?? undefined;
          if (!account) {
            return null;
          }

          return (
            <Box
              key={account.address}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${
                  virtualItem.start - virtualizer.options.scrollMargin
                }px)`,
              }}
            >
              <AccountListItemContainer
                account={account}
                selectedAccount={selectedAccount}
                dispatch={dispatch}
                trackEvent={trackEvent}
              />
            </Box>
          );
        })}
      </Box>
    </SendPageRow>
  );
};
