import React, { FunctionComponent, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CaipChainId } from '@metamask/utils';

import { AccountSelectorState, State } from '@metamask/snaps-sdk';
import { createAccountList, createChainIdList } from '@metamask/snaps-utils';
import { SnapUISelector } from '../snap-ui-selector';
import {
  getMetaMaskAccountsOrdered,
  InternalAccountWithBalance,
} from '../../../../selectors';

import { setSelectedInternalAccountWithoutLoading } from '../../../../store/actions';
import { useSnapInterfaceContext } from '../../../../contexts/snaps';
import AccountListItem from '../../../multichain/account-list-item/account-list-item';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { getAllAccountGroups } from '../../../../selectors/multichain-accounts/account-tree';

export type SnapUIAccountSelectorProps = {
  name: string;
  label?: string;
  form?: string;
  hideExternalAccounts?: boolean;
  chainIds?: CaipChainId[];
  switchGlobalAccount?: boolean;
  error?: string;
  disabled?: boolean;
};

/**
 * The SnapUIAccountSelector component.
 *
 * @param props - The component props.
 * @param props.name - The name of the selector.
 * @param props.label - The label of the selector.
 * @param props.form - The form the selector belongs to.
 * @param props.hideExternalAccounts - Whether to hide external accounts.
 * @param props.chainIds - The chainIds to filter the accounts by.
 * @param props.switchGlobalAccount - Whether to switch the global account.
 * @param props.error - The error message to display.
 * @param props.disabled - Whether the selector is disabled.
 * @returns The AccountSelector component.
 */
export const SnapUIAccountSelector: FunctionComponent<
  SnapUIAccountSelectorProps
> = ({
  chainIds,
  switchGlobalAccount,
  hideExternalAccounts,
  disabled,
  ...props
}) => {
  const t = useI18nContext();
  const { snapId } = useSnapInterfaceContext();
  const dispatch = useDispatch();
  const internalAccounts: InternalAccountWithBalance[] = useSelector(
    getMetaMaskAccountsOrdered,
  );
  const accountGroups = useSelector(getAllAccountGroups);

  const accounts = useMemo(() => {
    // Filter out the accounts that are not owned by the snap
    const ownedAccounts = internalAccounts.filter(
      (account) => account.metadata.snap?.id === snapId,
    );

    // Select which accounts to show and filter them by chainId
    const filteredAccounts = (
      hideExternalAccounts ? ownedAccounts : internalAccounts
    ).filter((account) => {
      const filteredChainIds = createChainIdList(account.scopes, chainIds);

      return filteredChainIds.length > 0;
    });

    // Get the name from the account group if it exists, otherwise use the account name
    // This is necessary because the account name is empty now and the group name is used instead,
    // but we still want to show the account name if the group name is not available.
    const updatedAccounts = filteredAccounts.map((account) => {
      const name =
        accountGroups.find(({ accounts: accountGroup }) =>
          accountGroup.includes(account.id),
        )?.metadata.name ?? account.metadata.name;

      return {
        ...account,
        metadata: {
          ...account.metadata,
          name,
        },
      };
    });

    return updatedAccounts;
  }, [internalAccounts, chainIds, hideExternalAccounts, snapId, accountGroups]);

  const options = accounts.map((account) => ({
    key: 'accountId',
    value: {
      accountId: account.id,
      addresses: createAccountList(
        account.address,
        createChainIdList(account.scopes, chainIds),
      ),
    },
    disabled: false,
  }));

  const optionComponents = accounts.map((account, index) => (
    <AccountListItem
      account={account}
      selected={false}
      key={index}
      showConnectedStatus={false}
    />
  ));

  const handleSelect = (value: State) => {
    if (switchGlobalAccount) {
      dispatch(
        setSelectedInternalAccountWithoutLoading(
          (value as AccountSelectorState).accountId,
        ),
      );
    }
  };

  return (
    <SnapUISelector
      className="snap-ui-renderer__account-selector"
      title={t('snapUIAccountSelectorTitle')}
      options={options}
      {...props}
      optionComponents={optionComponents}
      onSelect={handleSelect}
      disabled={disabled || accounts.length === 0}
      style={{
        maxHeight: '89px',
      }}
      itemStyle={{
        maxHeight: '89px',
      }}
    />
  );
};
