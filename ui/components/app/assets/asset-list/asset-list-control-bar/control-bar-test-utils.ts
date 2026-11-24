import type { NetworkConfiguration } from '@metamask/network-controller';
import mockState from '../../../../../../test/data/mock-state.json';

export const DEFAULT_ACCOUNT_GROUP_ID = 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0';
export const SOLANA_ACCOUNT_ID = 'solana-account-id';
export const SOLANA_CHAIN_ID = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';

const LEDGER_ACCOUNT_ID = '15e69915-2a1a-4019-93b3-916e11fd432f';
const LEDGER_ACCOUNT_GROUP_ID =
  'keyring:Ledger Hardware/0xc42edfcc21ed14dda456aa0756c153f7985d8813';

export const createMockState = () => {
  const state = structuredClone(mockState);

  return {
    ...state,
    metamask: {
      ...state.metamask,
      internalAccounts: {
        ...state.metamask.internalAccounts,
        accounts: {
          ...state.metamask.internalAccounts.accounts,
        },
      },
      accountTree: structuredClone(state.metamask.accountTree),
      multichainNetworkConfigurationsByChainId: {
        ...state.metamask.multichainNetworkConfigurationsByChainId,
      },
      selectedNetworkClientId: 'selectedNetworkClientId',
      completedOnboarding: true,
      networkConfigurationsByChainId: {
        '0x1': {
          chainId: '0x1',
          name: 'Ethereum Mainnet',
          nativeCurrency: 'ETH',
          defaultRpcEndpointIndex: 0,
          rpcEndpoints: [
            {
              networkClientId: 'selectedNetworkClientId',
            },
          ],
        },
      } as unknown as Record<string, NetworkConfiguration>,
      useNftDetection: true,
    },
  };
};

export type ControlBarMockState = ReturnType<typeof createMockState>;

export const selectLedgerAccount = (state: ControlBarMockState) => {
  state.metamask.internalAccounts.selectedAccount = LEDGER_ACCOUNT_ID;
  state.metamask.selectedAccountGroup = LEDGER_ACCOUNT_GROUP_ID;
};

export const addSolanaAccountToSelectedGroup = (state: ControlBarMockState) => {
  (state.metamask.internalAccounts.accounts as Record<string, unknown>)[
    SOLANA_ACCOUNT_ID
  ] = {
    address: '7Ec4p8d1VzC9QYQ35gzfSNJbdf2D2qTyhQEt9Dz6F5CQ',
    id: SOLANA_ACCOUNT_ID,
    metadata: {
      importTime: 0,
      name: 'Solana Account',
      keyring: {
        type: 'Snap Keyring',
      },
    },
    options: {},
    methods: ['solana_signTransaction'],
    scopes: [SOLANA_CHAIN_ID],
    type: 'solana:data-account',
  };
  state.metamask.accountTree.wallets[
    'entropy:01JKAF3DSGM3AB87EM9N0K41AJ'
  ].groups[DEFAULT_ACCOUNT_GROUP_ID].accounts.push(SOLANA_ACCOUNT_ID);
};

export const selectSolanaAccount = (state: ControlBarMockState) => {
  addSolanaAccountToSelectedGroup(state);
  state.metamask.internalAccounts.selectedAccount = SOLANA_ACCOUNT_ID;
  state.metamask.completedOnboarding = true;
};

export const selectChain = (
  state: ControlBarMockState,
  chainId: string,
  networkClientId: string,
) => {
  state.metamask.selectedNetworkClientId = networkClientId;
  state.metamask.networkConfigurationsByChainId = {
    [chainId]: {
      chainId,
      name: chainId,
      nativeCurrency: 'ETH',
      defaultRpcEndpointIndex: 0,
      rpcEndpoints: [{ networkClientId }],
    },
  } as unknown as Record<string, NetworkConfiguration>;
};
