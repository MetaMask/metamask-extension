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
    selectedNetworkClientId?: string;
    networksMetadata?: Record<string, unknown>;
    keyrings?: unknown[];
    activeTab?: unknown;
    connectedAccounts?: unknown[];
    pinnedAccountsList?: string[];
    hiddenAccountsList?: string[];
  },
): MultichainAccountsState & MultichainNetworkConfigurationsByChainIdState => ({
  metamask: {
    accountTree,
    internalAccounts,
    networkConfigurationsByChainId:
      networkConfigurations?.networkConfigurationsByChainId || {},
    multichainNetworkConfigurationsByChainId:
      networkConfigurations?.multichainNetworkConfigurationsByChainId || {},
    selectedNetworkClientId:
      networkConfigurations?.selectedNetworkClientId || 'mainnet',
    networksMetadata: networkConfigurations?.networksMetadata || {
      mainnet: {
        EIPS: { 1559: true },
        status: 'available',
      },
    },
    keyrings: networkConfigurations?.keyrings || [],
    connectedAccounts: networkConfigurations?.connectedAccounts || [],
    pinnedAccountsList: networkConfigurations?.pinnedAccountsList || [],
    hiddenAccountsList: networkConfigurations?.hiddenAccountsList || [],
  } as MultichainAccountsState['metamask'] &
    MultichainNetworkConfigurationsByChainIdState['metamask'],
  activeTab: networkConfigurations?.activeTab || {
    origin: 'https://example.com',
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
