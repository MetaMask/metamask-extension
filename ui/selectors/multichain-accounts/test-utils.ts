import { AccountGroupId } from '@metamask/account-api';
import { NetworkConfiguration } from '@metamask/network-controller';
import { MultichainNetworkConfiguration } from '@metamask/multichain-network-controller';
import { MultichainNetworkConfigurationsByChainIdState } from '../../../shared/modules/selectors/networks';
import {
  AccountTreeState,
  InternalAccountsState,
  MultichainAccountsState,
} from './account-tree.types';

// Helper function to create properly typed mock state
export const createMockMultichainAccountsState = (
  accountTree: AccountTreeState,
  internalAccounts: InternalAccountsState,
  networkConfigurations?: {
    networkConfigurationsByChainId?: Record<string, NetworkConfiguration>;
    multichainNetworkConfigurationsByChainId?: Record<
      string,
      MultichainNetworkConfiguration
    >;
  },
): MultichainAccountsState & MultichainNetworkConfigurationsByChainIdState => ({
  metamask: {
    accountTree,
    internalAccounts,
    networkConfigurationsByChainId:
      networkConfigurations?.networkConfigurationsByChainId || {},
    multichainNetworkConfigurationsByChainId:
      networkConfigurations?.multichainNetworkConfigurationsByChainId || {},
  },
});

// Helper function to create empty state
export const createEmptyState = (): MultichainAccountsState &
  MultichainNetworkConfigurationsByChainIdState =>
  createMockMultichainAccountsState(
    {
      wallets: {},
      selectedAccountGroup: null as unknown as AccountGroupId,
    },
    {
      accounts: {},
      selectedAccount: '',
    },
  );
