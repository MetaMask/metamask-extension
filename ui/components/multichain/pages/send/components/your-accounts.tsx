import React, { useCallback, useContext, useMemo } from 'react';
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
import { MetaMetricsContext } from '../../../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../../shared/constants/metametrics';
import { MergedInternalAccount } from '../../../../../selectors/selectors.types';
import { getMultichainIsEvm } from '../../../../../selectors/multichain';
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
  const selectedAccount = useSelector(getSelectedInternalAccount);

  ///: BEGIN:ONLY_INCLUDE_IF(multichain)
  const isEvmAccount = useSelector(getMultichainIsEvm);
  ///: END:ONLY_INCLUDE_IF

  const allAllowedAccountTypes = useMemo(() => {
    return isEvmAccount ? allowedAccountTypes : [selectedAccount.type];
  }, [isEvmAccount, selectedAccount.type, allowedAccountTypes]);

  // Your Accounts
  const accounts = useSelector(getUpdatedAndSortedAccounts);
  const filteredAccounts = useMemo(() => {
    return accounts.filter((account: InternalAccount) =>
      allAllowedAccountTypes.includes(account.type),
    );
  }, [accounts, allAllowedAccountTypes]);

  const onClick = useCallback(
    (account: MergedInternalAccount) => {
      dispatch(
        addHistoryEntry(
          `sendFlow - User clicked recipient from my accounts. address: ${account.address}, nickname ${account.metadata.name}`,
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
