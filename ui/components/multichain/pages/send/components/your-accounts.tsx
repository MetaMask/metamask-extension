import type { KeyringAccountType } from '@metamask/keyring-api';
import { EthAccountType } from '@metamask/keyring-api';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import React, { useCallback, useContext, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { AccountListItem } from '../../..';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../../../contexts/metametrics';
import {
  addHistoryEntry,
  updateRecipient,
  updateRecipientUserInput,
} from '../../../../../ducks/send';
import {
  getUpdatedAndSortedAccounts,
  getSelectedInternalAccount,
} from '../../../../../selectors';
import type { MergedInternalAccount } from '../../../../../selectors/selectors.types';
import { SendPageRow } from './send-page-row';

type SendPageYourAccountsProps = {
  allowedAccountTypes?: KeyringAccountType[];
};

const defaultAllowedAccountTypes = [EthAccountType.Eoa, EthAccountType.Erc4337];

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
  }, [accounts]);
  const selectedAccount = useSelector(getSelectedInternalAccount);

  const onClick = useCallback(
    (account: MergedInternalAccount) => {
      dispatch(
        addHistoryEntry(
          `sendFlow - User clicked recipient from my accounts. address: ${account.address}, nickname ${account.metadata.name}`,
        ),
      );
      // eslint-disable-next-line @typescript-eslint/no-floating-promises -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31878
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
          nickname: account.metadata.name,
        }),
      );
      dispatch(updateRecipientUserInput(account.address));
    },
    [dispatch, trackEvent],
  );

  return (
    <SendPageRow>
      {/* TODO: Replace `any` with type */}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {filteredAccounts.map((account: any) => (
        <AccountListItem
          account={account}
          selected={selectedAccount.address === account.address}
          key={account.address}
          isPinned={Boolean(account.pinned)}
          shouldScrollToWhenSelected={false}
          onClick={onClick}
        />
      ))}
    </SendPageRow>
  );
};
