import { AccountGroupId } from '@metamask/account-api';
import {
  AccountTreeState,
  InternalAccountsState,
  MultichainAccountsState,
} from './account-tree.types';
import { MultichainNetworkConfigurationsByChainIdState } from '../../../shared/modules/selectors/networks';

// Helper function to create properly typed mock state
export const createMockMultichainAccountsState = (
  accountTree: AccountTreeState,
  internalAccounts: InternalAccountsState,
  networkConfigurations?: {
    networkConfigurationsByChainId?: Record<string, any>;
    multichainNetworkConfigurationsByChainId?: Record<string, any>;
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
