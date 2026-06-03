import { AccountGroupId } from '@metamask/account-api';
import { NetworkConfiguration } from '@metamask/network-controller';
import { MultichainNetworkConfiguration } from '@metamask/multichain-network-controller';
import { MultichainNetworkConfigurationsByChainIdState } from '../../../shared/lib/selectors/networks';
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
  selectedAccountGroup: AccountGroupId | null = null as unknown as AccountGroupId,
): MultichainAccountsState & MultichainNetworkConfigurationsByChainIdState => ({
  metamask: {
    selectedAccountGroup: selectedAccountGroup as AccountGroupId,
    accountTree,
    internalAccounts,
    accountIdByAddress: Object.fromEntries(
      Object.values(internalAccounts.accounts).map((account) => [
        account.address,
        account.id,
      ]),
    ),
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
    },
    {
      accounts: {},
      selectedAccount: '',
    },
    undefined,
    null as unknown as AccountGroupId,
  );
