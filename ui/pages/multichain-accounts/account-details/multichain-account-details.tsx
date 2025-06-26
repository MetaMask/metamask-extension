import React from 'react';
import { useSelector } from 'react-redux';
import { AppSliceState } from '../../../ducks/app/app';
import { getInternalAccountByAddress } from '../../../selectors';
import { EVMAccountDetails } from './evm-account-details';
import { getAccountTypeCategory } from './account-type-utils';
import { SolanaAccountDetails } from './solana-account-details';
import { HardwareAccountDetails } from './hardware-account-details';
import { PrivateKeyAccountDetails } from './private-key-account-details';
import { InstitutionalEVMAccountDetails } from './institutional-evm-account-details';

export const MultichainAccountDetails = () => {
  const address = useSelector(
    (state: AppSliceState) => state.appState.accountDetailsAddress,
  );
  const account = useSelector((state) =>
    getInternalAccountByAddress(state, address),
  );

  const accountTypeCategory = getAccountTypeCategory(account);

  const renderAccountDetailsByType = () => {
    switch (accountTypeCategory) {
      case 'evm':
        return <EVMAccountDetails address={address} account={account} />;

      case 'solana':
        return <SolanaAccountDetails address={address} account={account} />;

      case 'hardware':
        return <HardwareAccountDetails address={address} account={account} />;

      case 'private-key':
        return <PrivateKeyAccountDetails address={address} account={account} />;

      case 'institutional-evm':
        return <InstitutionalEVMAccountDetails address={address} account={account} />;

      default:
        return null;
    }
  };

  return renderAccountDetailsByType();
};