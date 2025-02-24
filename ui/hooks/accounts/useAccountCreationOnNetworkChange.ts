import { useSelector } from 'react-redux';
import { CaipChainId } from '@metamask/utils';
import { MultichainNetworks } from '../../../shared/constants/multichain/networks';
import { getMetaMaskAccountsOrdered } from '../../selectors';
import {
  useMultichainWalletSnapClient,
  WalletClientType,
} from './useMultichainWalletSnapClient';

type UseAccountCreationOnNetworkChangeReturn = {
  createAccount: (chainId: CaipChainId) => Promise<void>;
  hasAnyAccountsInNetwork: (chainId: CaipChainId) => boolean;
};

export const useAccountCreationOnNetworkChange =
  (): UseAccountCreationOnNetworkChangeReturn => {
    const bitcoinWalletSnapClient = useMultichainWalletSnapClient(
      WalletClientType.Bitcoin,
    );
    const solanaWalletSnapClient = useMultichainWalletSnapClient(
      WalletClientType.Solana,
    );
    const accounts = useSelector(getMetaMaskAccountsOrdered);

    const createAccount = async (chainId: CaipChainId) => {
      switch (chainId) {
        case MultichainNetworks.BITCOIN:
          await bitcoinWalletSnapClient.createAccount(
            MultichainNetworks.BITCOIN,
          );
          break;
        case MultichainNetworks.SOLANA:
          await solanaWalletSnapClient.createAccount(MultichainNetworks.SOLANA);
          break;
        default:
          throw new Error(`Unsupported chainId: ${chainId}`);
      }
    };

    const hasAnyAccountsInNetwork = (chainId: CaipChainId) => {
      return accounts.some(({ scopes }: { scopes: CaipChainId[] }) =>
        scopes.includes(chainId),
      );
    };

    return { createAccount, hasAnyAccountsInNetwork };
  };
