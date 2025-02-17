import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { CaipChainId } from '@metamask/utils';
import { useMultichainWalletSnapClient, WalletClientType } from './useMultichainWalletSnapClient';
import { MultichainNetworks } from '../../../shared/constants/multichain/networks';
import type { InternalAccountWithBalance } from '../../selectors/selectors.types';
import { getMetaMaskAccountsOrdered } from '../../selectors';

interface UseAccountCreationOnNetworkChangeReturn {
  createAccount: (chainId: CaipChainId) => Promise<void>;
  isAccountInNetwork: (chainId: CaipChainId) => boolean;
}

export const useAccountCreationOnNetworkChange = (): UseAccountCreationOnNetworkChangeReturn => {
  const bitcoinWalletSnapClient = useMultichainWalletSnapClient(WalletClientType.Bitcoin);
  const solanaWalletSnapClient = useMultichainWalletSnapClient(WalletClientType.Solana);
  const accounts = useSelector(getMetaMaskAccountsOrdered);

  const createAccount = async (chainId: CaipChainId) => {
    switch (chainId) {
      case MultichainNetworks.BITCOIN:
        await bitcoinWalletSnapClient.createAccount(MultichainNetworks.BITCOIN);
        break;
      case MultichainNetworks.SOLANA:
        await solanaWalletSnapClient.createAccount(MultichainNetworks.SOLANA);
        break;
      default:
        throw new Error(`Unsupported chainId: ${chainId}`);
    }
  };

  const isAccountInNetwork = (chainId: CaipChainId) => {
    return accounts.some(({ scopes }: { scopes: CaipChainId[] }) => scopes.includes(chainId));
  };

  return { createAccount, isAccountInNetwork };
};
