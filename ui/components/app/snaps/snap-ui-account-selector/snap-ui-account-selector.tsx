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

function createChainIdList(
  accountScopes: CaipChainId[],
  requestedChainIds?: CaipChainId[],
) {
  return accountScopes.reduce((acc, scope) => {
    if (scope === EthScope.Eoa && requestedChainIds) {
      const targetChainIds = requestedChainIds.filter((chainId) => {
        const { namespace } = parseCaipChainId(chainId);

        return namespace === KnownCaipNamespace.Eip155;
      });

      return [...acc, ...targetChainIds];
    }

    if (requestedChainIds?.includes(scope)) {
      return [...acc, scope];
    }

    if (!requestedChainIds) {
      return [...acc, scope];
    }

    return acc;
  }, [] as CaipChainId[]);
}

export type SnapUIAccountSelectorProps = {
  name: string;
  label?: string;
  form?: string;
  hideExternalAccounts?: boolean;
  chainIds?: CaipChainId[];
  switchSelectedAccount?: boolean;
  error?: string;
  disabled?: boolean;
};

export const SnapUIAccountSelector: FunctionComponent<
  SnapUIAccountSelectorProps
> = ({ chainIds, switchSelectedAccount, hideExternalAccounts, ...props }) => {
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
    if (switchSelectedAccount) {
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
