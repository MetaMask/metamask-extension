import React from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { getInternalAccountByAddress } from '../../../selectors';
import { EVMAccountDetails } from './evm-account-details';
import { getAccountTypeCategory } from './account-type-utils';
import { SolanaAccountDetails } from './solana-account-details';
import { HardwareAccountDetails } from './hardware-account-details';
import { PrivateKeyAccountDetails } from './private-key-account-details';
import { InstitutionalEVMAccountDetails } from './institutional-evm-account-details';
import { BitcoinAccountDetails } from './btc-account-details';
import { TronAccountDetails } from './tron-account-details';

export const MultichainAccountDetails = () => {
  const { address } = useParams();
  const account = useSelector((state) =>
    getInternalAccountByAddress(state, address),
  );

  const accountTypeCategory = getAccountTypeCategory(account);

  const renderAccountDetailsByType = () => {
    switch (accountTypeCategory) {
      case 'evm':
        return (
          <EVMAccountDetails address={address as string} account={account} />
        );

      case 'solana':
        return (
          <SolanaAccountDetails address={address as string} account={account} />
        );

      case 'hardware':
        return (
          <HardwareAccountDetails
            address={address as string}
            account={account}
          />
        );

      case 'private-key':
        return (
          <PrivateKeyAccountDetails
            address={address as string}
            account={account}
          />
        );

      case 'institutional-evm':
        return (
          <InstitutionalEVMAccountDetails
            address={address as string}
            account={account}
          />
        );

      case 'bitcoin':
        return (
          <BitcoinAccountDetails
            address={address as string}
            account={account}
          />
        );

      case 'tron':
        return (
          <TronAccountDetails address={address as string} account={account} />
        );

      default:
        return null;
    }
  };

  return renderAccountDetailsByType();
};
