import React from 'react';
import { useSelector } from 'react-redux';
import {
  BtcAccountType,
  EthAccountType,
  SolAccountType,
} from '@metamask/keyring-api';
import { getSelectedInternalAccount } from '../../../selectors';
import { AccountOverviewEth } from './account-overview-eth';
import { AccountOverviewUnknown } from './account-overview-unknown';
import { AccountOverviewCommonProps } from './common';
import { AccountOverviewNonEvm } from './account-overview-non-evm';

export type AccountOverviewProps = AccountOverviewCommonProps & {
  useExternalServices: boolean;
};

export function AccountOverview(props: AccountOverviewProps) {
  const account = useSelector(getSelectedInternalAccount);

  const renderAccountOverviewOption = () => {
    switch (account.type) {
      case EthAccountType.Eoa:
      case EthAccountType.Erc4337:
        return <AccountOverviewEth {...props}></AccountOverviewEth>;
      case BtcAccountType.P2pkh:
      case BtcAccountType.P2sh:
      case BtcAccountType.P2wpkh:
      case BtcAccountType.P2tr:
      case SolAccountType.DataAccount:
        return <AccountOverviewNonEvm {...props}></AccountOverviewNonEvm>;
      default:
        return <AccountOverviewUnknown {...props}></AccountOverviewUnknown>;
    }
  };

  return <>{renderAccountOverviewOption()}</>;
}
