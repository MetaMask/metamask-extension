import React, { FunctionComponent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  CaipChainId,
  KnownCaipNamespace,
  parseCaipChainId,
} from '@metamask/utils';

import { AccountSelectorState, State } from '@metamask/snaps-sdk';
import { EthScope } from '@metamask/keyring-api';
import { createAccountList } from '@metamask/snaps-utils';
import { SnapUISelector } from '../snap-ui-selector';
import {
  getMetaMaskAccountsOrdered,
  InternalAccountWithBalance,
} from '../../../../selectors';

import { setSelectedInternalAccount } from '../../../../store/actions';
import { useSnapInterfaceContext } from '../../../../contexts/snaps';
import AccountListItem from '../../../multichain/account-list-item/account-list-item';
import { createChainIdList } from '@metamask/snaps-utils';

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
> = ({ chainIds, switchGlobalAccount, hideExternalAccounts, ...props }) => {
  const { snapId } = useSnapInterfaceContext();
  const dispatch = useDispatch();
  const accounts: InternalAccountWithBalance[] = useSelector(
    getMetaMaskAccountsOrdered,
  );

  const ownedAccounts = accounts.filter(
    (account) => account.metadata.snap?.id === snapId,
  );

  const filteredAccounts = (
    hideExternalAccounts ? ownedAccounts : accounts
  ).filter((account) => {
    const filteredChainIds = createChainIdList(account.scopes, chainIds);

    return filteredChainIds.length > 0;
  });

  const options = filteredAccounts.map((account) => ({
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

  const optionComponents = filteredAccounts.map((account, index) => (
    <AccountListItem account={account} selected={false} key={index} />
  ));

  const handleSelect = (value: State) => {
    if (switchGlobalAccount) {
      dispatch(
        setSelectedInternalAccount((value as AccountSelectorState).accountId),
      );
    }
  };

  return (
    <SnapUISelector
      className="snap-ui-renderer__account-selector"
      title={'Select account'}
      options={options}
      {...props}
      optionComponents={optionComponents}
      onSelect={handleSelect}
      style={{
        maxHeight: '82px',
      }}
    />
  );
};
