import { ApprovalType } from '@metamask/controller-utils';
import { KnownCaipNamespace } from '@metamask/utils';
import {
  BtcAccountType,
  EthAccountType,
  EthMethod,
  SolAccountType,
} from '@metamask/keyring-api';
import { AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS } from '@metamask/multichain-network-controller';
import { deepClone } from '@metamask/snaps-utils';
import { TransactionStatus } from '@metamask/transaction-controller';
import { KeyringTypes } from '@metamask/keyring-controller';
import { KeyringType } from '../../shared/constants/keyring';
import mockState from '../../test/data/mock-state.json';
import { CHAIN_IDS, NETWORK_TYPES } from '../../shared/constants/network';
import { createMockInternalAccount } from '../../test/jest/mocks';
import { mockNetworkState } from '../../test/stub/networks';
import { DeleteRegulationStatus } from '../../shared/constants/metametrics';
import * as networkSelectors from '../../shared/modules/selectors/networks';
import { MultichainNetworks } from '../../shared/constants/multichain/networks';

import {
  SOLANA_WALLET_NAME,
  SOLANA_WALLET_SNAP_ID,
} from '../../shared/lib/accounts';
import * as selectors from './selectors';

jest.mock('../../shared/modules/selectors/networks', () => ({
  ...jest.requireActual('../../shared/modules/selectors/networks'),
}));

jest.mock('../../app/scripts/lib/util', () => ({
  ...jest.requireActual('../../app/scripts/lib/util'),
  getEnvironmentType: jest.fn().mockReturnValue('popup'),
}));

jest.mock('../../shared/modules/network.utils', () => {
  const actual = jest.requireActual('../../shared/modules/network.utils');
  return {
    ...actual,
    shouldShowLineaMainnet: jest.fn().mockResolvedValue(true),
  };
});

jest.mock('./multichain/networks', () => ({
  ...jest.requireActual('./multichain/networks'),
  getIsEvmMultichainNetworkSelected: jest.fn(
    (state) => state.metamask.isEvmSelected,
  ),
  getSelectedMultichainNetworkChainId: jest.fn((state) => {
    if (state.metamask.isEvmSelected) {
      const chainId = state.metamask.networkConfigurationsByChainId
        ? Object.keys(state.metamask.networkConfigurationsByChainId)[0]
        : '0x1';
      return `eip155:${parseInt(chainId, 16)}`;
    }
    return state.metamask.selectedMultichainNetworkChainId;
  }),
}));

const modifyStateWithHWKeyring = (keyring) => {
  const modifiedState = deepClone(mockState);
  modifiedState.metamask.internalAccounts.accounts[
    modifiedState.metamask.internalAccounts.selectedAccount
  ].metadata.keyring.type = keyring;

  return modifiedState;
};

const mockAccountsState = (accounts) => {
  const accountsMap = accounts.reduce((map, account) => {
    map[account.id] = account;
    return map;
  }, {});

  return {
    metamask: {
      internalAccounts: {
        accounts: accountsMap,
      },
    },
  };
};

describe('Selectors', () => {
  describe('#getSelectedAddress', () => {
    it('returns undefined if selectedAddress is undefined', () => {
      expect(
        selectors.getSelectedAddress({
          metamask: { internalAccounts: { accounts: {}, selectedAccount: '' } },
        }),
      ).toBeUndefined();
    });

    it('returns selectedAddress', () => {
      const mockInternalAccount = createMockInternalAccount();
      const internalAccounts = {
        accounts: {
          [mockInternalAccount.id]: mockInternalAccount,
        },
        selectedAccount: mockInternalAccount.id,
      };

      expect(
        selectors.getSelectedAddress({ metamask: { internalAccounts } }),
      ).toStrictEqual(mockInternalAccount.address);
    });
  });

  describe('#checkIfMethodIsEnabled', () => {
    it('returns true if the method is enabled', () => {
      expect(
        selectors.checkIfMethodIsEnabled(mockState, EthMethod.SignTransaction),
      ).toBe(true);
    });

    it('returns false if the method is not enabled', () => {
      expect(
        selectors.checkIfMethodIsEnabled(
          {
            metamask: {
              internalAccounts: {
                accounts: {
                  'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
                    ...mockState.metamask.internalAccounts.accounts[
                      'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3'
                    ],
                    methods: [
                      ...Object.values(EthMethod).filter(
                        (method) => method !== EthMethod.SignTransaction,
                      ),
                    ],
                  },
                },
                selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
              },
            },
          },
          EthMethod.SignTransaction,
        ),
      ).toBe(false);
    });
  });

  describe('#getInternalAccount', () => {
    it("returns undefined if the account doesn't exist", () => {
      expect(
        selectors.getInternalAccount(mockState, 'unknown'),
      ).toBeUndefined();
    });

    it('returns the account', () => {
      expect(
        selectors.getInternalAccount(
          mockState,
          'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
        ),
      ).toStrictEqual(
        mockState.metamask.internalAccounts.accounts[
          'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3'
        ],
      );
    });
  });

  describe('#getNumberOfAllUnapprovedTransactionsAndMessages', () => {
    it('returns no unapproved transactions and messages', () => {
      expect(
        selectors.getNumberOfAllUnapprovedTransactionsAndMessages({
          metamask: {
            transactions: [],
          },
        }),
      ).toStrictEqual(0);
    });

    it('returns correct number of unapproved transactions', () => {
      expect(
        selectors.getNumberOfAllUnapprovedTransactionsAndMessages({
          metamask: {
            transactions: [
              {
                id: 0,
                chainId: CHAIN_IDS.MAINNET,
                time: 0,
                txParams: {
                  from: '0xAddress',
                  to: '0xRecipient',
                },
                status: TransactionStatus.unapproved,
              },
              {
                id: 1,
                chainId: CHAIN_IDS.MAINNET,
                time: 0,
                txParams: {
                  from: '0xAddress',
                  to: '0xRecipient',
                },
                status: TransactionStatus.unapproved,
              },
            ],
            unapprovedPersonalMsgs: {
              2: {
                id: 2,
                msgParams: {
                  from: '0xAddress',
                  data: '0xData',
                  origin: 'origin',
                },
                time: 1,
                status: TransactionStatus.unapproved,
                type: 'personal_sign',
              },
            },
          },
        }),
      ).toStrictEqual(3);
    });

    it('returns correct number of unapproved transactions and messages', () => {
      expect(
        selectors.getNumberOfAllUnapprovedTransactionsAndMessages({
          metamask: {
            networkConfigurationsByChainId: {
              [CHAIN_IDS.MAINNET]: {
                chainId: CHAIN_IDS.MAINNET,
                rpcEndpoints: [{}],
              },
            },
            transactions: [
              {
                id: 0,
                chainId: CHAIN_IDS.MAINNET,
                time: 0,
                txParams: {
                  from: '0xAddress',
                  to: '0xRecipient',
                },
                status: TransactionStatus.unapproved,
              },
            ],
            unapprovedTypedMessages: {
              1: {
                id: 1,
                msgParams: {
                  from: '0xAddress',
                  data: '0xData',
                  origin: 'origin',
                },
                time: 1,
                status: TransactionStatus.unapproved,
                type: 'eth_signTypedData',
              },
            },
          },
        }),
      ).toStrictEqual(2);
    });
  });

  describe('#getNetworkToAutomaticallySwitchTo', () => {
    const SELECTED_ORIGIN = 'https://app.metamask.io';
    const SELECTED_ORIGIN_NETWORK_ID = NETWORK_TYPES.LINEA_SEPOLIA;
    const state = {
      activeTab: {
        origin: SELECTED_ORIGIN,
      },
      metamask: {
        isUnlocked: true,
        selectedTabOrigin: SELECTED_ORIGIN,
        unapprovedDecryptMsgs: [],
        unapprovedPersonalMsgs: [],
        unapprovedEncryptionPublicKeyMsgs: [],
        unapprovedTypedMessages: [],
        domains: {
          [SELECTED_ORIGIN]: SELECTED_ORIGIN_NETWORK_ID,
        },
        networkConfigurationsByChainId: {
          [CHAIN_IDS.MAINNET]: {
            chainId: CHAIN_IDS.MAINNET,
            defaultRpcEndpointIndex: 0,
            rpcEndpoints: [
              {
                url: 'https://testrpc.com',
                networkClientId: mockState.metamask.selectedNetworkClientId,
              },
            ],
          },
        },
        transactions: [],
        selectedNetworkClientId: mockState.metamask.selectedNetworkClientId,
        // networkConfigurations:
        //   mockState.metamask.networkConfigurationsByChainId,
      },
    };

    it('should return the network to switch to', () => {
      const networkToSwitchTo =
        selectors.getNetworkToAutomaticallySwitchTo(state);
      expect(networkToSwitchTo).toBe(SELECTED_ORIGIN_NETWORK_ID);
    });

    it('should return no network to switch to because we are already on it', () => {
      const networkToSwitchTo = selectors.getNetworkToAutomaticallySwitchTo({
        ...state,
        metamask: {
          ...state.metamask,
          selectedNetworkClientId: 'linea-sepolia',
          networkConfigurationsByChainId: {
            [CHAIN_IDS.LINEA_SEPOLIA]: {
              chainId: CHAIN_IDS.LINEA_SEPOLIA,
              defaultRpcEndpointIndex: 0,
              rpcEndpoints: [
                {
                  url: 'https://testrpc.com',
                  networkClientId: 'linea-sepolia',
                  type: 'custom',
                },
              ],
            },
          },
        },
      });
      expect(networkToSwitchTo).toBe(null);
    });

    it('should return no network to switch to because there are pending transactions', () => {
      const networkToSwitchTo = selectors.getNetworkToAutomaticallySwitchTo({
        ...state,
        metamask: {
          ...state.metamask,
          selectedNetworkClientId: NETWORK_TYPES.LINEA_SEPOLIA,
          networkConfigurationsByChainId: {
            [CHAIN_IDS.LINEA_SEPOLIA]: {
              chainId: CHAIN_IDS.LINEA_SEPOLIA,
              defaultRpcEndpointIndex: 0,
              rpcEndpoints: [
                {
                  url: 'https://testrpc.com',
                  networkClientId: 'linea-sepolia',
                  type: 'custom',
                },
              ],
            },
          },
          transactions: [
            {
              id: 0,
              chainId: CHAIN_IDS.MAINNET,
              status: TransactionStatus.approved,
            },
          ],
        },
      });
      expect(networkToSwitchTo).toBe(null);
    });
  });

  describe('#getSuggestedTokens', () => {
    it('returns an empty array if pendingApprovals is undefined', () => {
      expect(selectors.getSuggestedTokens({ metamask: {} })).toStrictEqual([]);
    });

    it('returns suggestedTokens from filtered pending approvals', () => {
      const pendingApprovals = {
        1: {
          id: '1',
          origin: 'dapp',
          time: 1,
          type: ApprovalType.WatchAsset,
          requestData: {
            asset: {
              address: '0x8b175474e89094c44da98b954eedeac495271d0a',
              symbol: 'NEW',
              decimals: 18,
              image: 'metamark.svg',
            },
          },
          requestState: null,
        },
        2: {
          id: '2',
          origin: 'dapp',
          time: 1,
          type: ApprovalType.WatchAsset,
          requestData: {
            asset: {
              address: '0xC8c77482e45F1F44dE1745F52C74426C631bDD51',
              symbol: '0XYX',
              decimals: 18,
              image: '0x.svg',
            },
          },
        },
        3: {
          id: '3',
          origin: 'origin',
          time: 1,
          type: ApprovalType.Transaction,
          requestData: {
            // something that is not an asset
          },
        },
        4: {
          id: '4',
          origin: 'dapp',
          time: 1,
          type: ApprovalType.WatchAsset,
          requestData: {
            asset: {
              address: '0x1234abcd',
              symbol: '0XYX',
              tokenId: '123',
            },
          },
        },
      };

      expect(
        selectors.getSuggestedTokens({ metamask: { pendingApprovals } }),
      ).toStrictEqual([
        {
          id: '1',
          origin: 'dapp',
          time: 1,
          type: ApprovalType.WatchAsset,
          requestData: {
            asset: {
              address: '0x8b175474e89094c44da98b954eedeac495271d0a',
              symbol: 'NEW',
              decimals: 18,
              image: 'metamark.svg',
            },
          },
          requestState: null,
        },
        {
          id: '2',
          origin: 'dapp',
          time: 1,
          type: ApprovalType.WatchAsset,
          requestData: {
            asset: {
              address: '0xC8c77482e45F1F44dE1745F52C74426C631bDD51',
              symbol: '0XYX',
              decimals: 18,
              image: '0x.svg',
            },
          },
        },
      ]);
    });
  });

  describe('#getSuggestedNfts', () => {
    it('returns an empty array if pendingApprovals is undefined', () => {
      expect(selectors.getSuggestedNfts({ metamask: {} })).toStrictEqual([]);
    });

    it('returns suggestedNfts from filtered pending approvals', () => {
      const pendingApprovals = {
        1: {
          id: '1',
          origin: 'dapp',
          time: 1,
          type: ApprovalType.WatchAsset,
          requestData: {
            asset: {
              address: '0x8b175474e89094c44da98b954eedeac495271d0a',
              symbol: 'NEW',
              decimals: 18,
              image: 'metamark.svg',
            },
          },
          requestState: null,
        },
        2: {
          id: '2',
          origin: 'dapp',
          time: 1,
          type: ApprovalType.WatchAsset,
          requestData: {
            asset: {
              address: '0xC8c77482e45F1F44dE1745F52C74426C631bDD51',
              symbol: '0XYX',
              decimals: 18,
              image: '0x.svg',
            },
          },
        },
        3: {
          id: '3',
          origin: 'origin',
          time: 1,
          type: ApprovalType.Transaction,
          requestData: {
            // something that is not an asset
          },
        },
        4: {
          id: '4',
          origin: 'dapp',
          time: 1,
          type: ApprovalType.WatchAsset,
          requestData: {
            asset: {
              address: '0x1234abcd',
              symbol: '0XYX',
              tokenId: '123',
              standard: 'ERC721',
            },
          },
        },
      };

      expect(
        selectors.getSuggestedNfts({ metamask: { pendingApprovals } }),
      ).toStrictEqual([
        {
          id: '4',
          origin: 'dapp',
          time: 1,
          type: ApprovalType.WatchAsset,
          requestData: {
            asset: {
              address: '0x1234abcd',
              symbol: '0XYX',
              tokenId: '123',
              standard: 'ERC721',
            },
          },
        },
      ]);
    });
  });

  describe('#getNewNetworkAdded', () => {
    it('returns undefined if newNetworkAddedName is undefined', () => {
      expect(selectors.getNewNetworkAdded({ appState: {} })).toBeUndefined();
    });

    it('returns newNetworkAddedName', () => {
      expect(
        selectors.getNewNetworkAdded({
          appState: { newNetworkAddedName: 'test-chain' },
        }),
      ).toStrictEqual('test-chain');
    });
  });

  describe('#getEditedNetwork', () => {
    it('returns undefined if getEditedNetwork is undefined', () => {
      expect(selectors.getNewNetworkAdded({ appState: {} })).toBeUndefined();
    });

    it('returns getEditedNetwork', () => {
      expect(
        selectors.getEditedNetwork({
          appState: { editedNetwork: 'test-chain' },
        }),
      ).toStrictEqual('test-chain');
    });
  });

  // todo
  describe('#getRpcPrefsForCurrentProvider', () => {
    it('returns rpcPrefs from the providerConfig', () => {
      expect(
        selectors.getRpcPrefsForCurrentProvider({
          metamask: {
            ...mockNetworkState({
              chainId: '0x1',
              blockExplorerUrl: 'https://test-block-explorer',
            }),
          },
        }),
      ).toStrictEqual({ blockExplorerUrl: 'https://test-block-explorer' });
    });
  });

  describe('#getNetworksTabSelectedNetworkConfigurationId', () => {
    it('returns undefined if selectedNetworkConfigurationId is undefined', () => {
      expect(
        selectors.getNetworksTabSelectedNetworkConfigurationId({
          appState: {},
        }),
      ).toBeUndefined();
    });

    it('returns selectedNetworkConfigurationId', () => {
      expect(
        selectors.getNetworksTabSelectedNetworkConfigurationId({
          appState: {
            selectedNetworkConfigurationId: 'testNetworkConfigurationId',
          },
        }),
      ).toStrictEqual('testNetworkConfigurationId');
    });
  });

  describe('#getCurrentNetwork', () => {
    it('returns built-in network configuration', () => {
      const modifiedMockState = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          selectedNetworkClientId: NETWORK_TYPES.SEPOLIA,
          blockExplorerUrls: [],
          ...mockNetworkState({ chainId: CHAIN_IDS.SEPOLIA, id: 'sepolia' }),
        },
      };
      const currentNetwork = selectors.getCurrentNetwork(modifiedMockState);

      expect(currentNetwork).toMatchInlineSnapshot(`
        {
          "blockExplorerUrl": "https://localhost/blockExplorer/0xaa36a7",
          "chainId": "0xaa36a7",
          "id": "sepolia",
          "nickname": "Sepolia",
          "rpcPrefs": {
            "blockExplorerUrl": "https://localhost/blockExplorer/0xaa36a7",
            "imageUrl": undefined,
          },
          "rpcUrl": "https://localhost/rpc/0xaa36a7",
          "ticker": "SepoliaETH",
        }
      `);
    });

    it('returns custom network configuration', () => {
      const mockNetworkConfigurationId = 'mock-network-config-id';
      const modifiedMockState = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          ...mockNetworkState({
            rpcUrl: 'https://mock-rpc-endpoint.test',
            chainId: '0x9999',
            ticker: 'TST',
            id: mockNetworkConfigurationId,
            blockExplorerUrl: undefined,
          }),
        },
      };

      const currentNetwork = selectors.getCurrentNetwork(modifiedMockState);

      expect(currentNetwork).toMatchInlineSnapshot(`
        {
          "blockExplorerUrl": undefined,
          "chainId": "0x9999",
          "id": "mock-network-config-id",
          "nickname": undefined,
          "rpcPrefs": {
            "blockExplorerUrl": undefined,
            "imageUrl": undefined,
          },
          "rpcUrl": "https://mock-rpc-endpoint.test",
          "ticker": "TST",
        }
      `);
    });

    it('returns the correct custom network when there is a chainId collision', () => {
      const modifiedMockState = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          selectedNetworkClientId: 'testNetworkConfigurationId',
          networkConfigurationsByChainId: {
            '0x1': {
              chainId: '0x1',
              name: 'Custom Mainnet RPC',
              nativeCurrency: 'ETH',
              defaultRpcEndpointIndex: 0,
              rpcEndpoints: [
                {
                  url: 'https://testrpc.com',
                  networkClientId: 'testNetworkConfigurationId',
                  type: 'custom',
                },
              ],
            },
          },
        },
      };

      const currentNetwork = selectors.getCurrentNetwork(modifiedMockState);
      expect(currentNetwork.nickname).toBe('Custom Mainnet RPC');
      expect(currentNetwork.chainId).toBe('0x1');
    });

    it('returns the correct mainnet network when there is a chainId collision', () => {
      const modifiedMockState = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
        },
      };
      const currentNetwork = selectors.getCurrentNetwork(modifiedMockState);
      expect(currentNetwork.nickname).toBe('Ethereum');
    });
  });

  describe('#getAllEnabledNetworks', () => {
    const networkConfigurationsByChainId = {
      [CHAIN_IDS.MAINNET]: {
        chainId: CHAIN_IDS.MAINNET,
        defaultRpcEndpointIndex: 0,
        rpcEndpoints: [{ networkClientId: 'mainnet' }],
      },
      [CHAIN_IDS.LINEA_MAINNET]: {
        chainId: CHAIN_IDS.LINEA_MAINNET,
        defaultRpcEndpointIndex: 0,
        rpcEndpoints: [{ networkClientId: 'linea-mainnet' }],
      },
      [CHAIN_IDS.SEPOLIA]: {
        chainId: CHAIN_IDS.SEPOLIA,
        defaultRpcEndpointIndex: 0,
        rpcEndpoints: [{ networkClientId: 'sepolia' }],
      },
      [CHAIN_IDS.LINEA_SEPOLIA]: {
        chainId: CHAIN_IDS.LINEA_SEPOLIA,
        defaultRpcEndpointIndex: 0,
        rpcEndpoints: [{ networkClientId: 'linea-sepolia' }],
      },
    };

    it('returns only Mainnet and Linea with showTestNetworks off', () => {
      const networks = selectors.getAllEnabledNetworks({
        metamask: {
          preferences: { showTestNetworks: false },
          networkConfigurationsByChainId,
        },
      });
      expect(Object.values(networks)).toHaveLength(2);
    });

    it('returns networks with showTestNetworks on', () => {
      const networks = selectors.getAllEnabledNetworks({
        metamask: {
          preferences: {
            showTestNetworks: true,
          },
          networkConfigurationsByChainId,
        },
      });

      expect(Object.values(networks).length).toBeGreaterThan(2);
    });
  });

  describe('#getChainIdsToPoll', () => {
    const networkConfigurationsByChainId = {
      [CHAIN_IDS.MAINNET]: {
        chainId: CHAIN_IDS.MAINNET,
        defaultRpcEndpointIndex: 0,
        rpcEndpoints: [{ networkClientId: 'mainnet' }],
      },
      [CHAIN_IDS.LINEA_MAINNET]: {
        chainId: CHAIN_IDS.LINEA_MAINNET,
        defaultRpcEndpointIndex: 0,
        rpcEndpoints: [{ networkClientId: 'linea-mainnet' }],
      },
      [CHAIN_IDS.SEPOLIA]: {
        chainId: CHAIN_IDS.SEPOLIA,
        defaultRpcEndpointIndex: 0,
        rpcEndpoints: [{ networkClientId: 'sepolia' }],
      },
      [CHAIN_IDS.LINEA_SEPOLIA]: {
        chainId: CHAIN_IDS.LINEA_SEPOLIA,
        defaultRpcEndpointIndex: 0,
        rpcEndpoints: [{ networkClientId: 'linea-sepolia' }],
      },
    };

    beforeEach(() => {
      process.env.PORTFOLIO_VIEW = 'true';
    });

    afterEach(() => {
      process.env.PORTFOLIO_VIEW = undefined;
    });

    it('returns only non-test chain IDs', () => {
      const chainIds = selectors.getChainIdsToPoll({
        metamask: {
          enabledNetworkMap: {
            eip155: {
              [CHAIN_IDS.MAINNET]: true,
              [CHAIN_IDS.LINEA_MAINNET]: true,
            },
          },
          networkConfigurationsByChainId,
          selectedNetworkClientId: 'mainnet',
          multichainNetworkConfigurationsByChainId:
            AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS,
          selectedMultichainNetworkChainId: 'eip155:1',
          isEvmSelected: true,
        },
      });
      expect(Object.values(chainIds)).toHaveLength(2);
      expect(chainIds).toStrictEqual([
        CHAIN_IDS.MAINNET,
        CHAIN_IDS.LINEA_MAINNET,
      ]);
    });
  });

  describe('#getNetworkClientIdsToPoll', () => {
    const networkConfigurationsByChainId = {
      [CHAIN_IDS.MAINNET]: {
        chainId: CHAIN_IDS.MAINNET,
        defaultRpcEndpointIndex: 0,
        rpcEndpoints: [{ networkClientId: 'mainnet' }],
      },
      [CHAIN_IDS.LINEA_MAINNET]: {
        chainId: CHAIN_IDS.LINEA_MAINNET,
        defaultRpcEndpointIndex: 0,
        rpcEndpoints: [{ networkClientId: 'linea-mainnet' }],
      },
      [CHAIN_IDS.SEPOLIA]: {
        chainId: CHAIN_IDS.SEPOLIA,
        defaultRpcEndpointIndex: 0,
        rpcEndpoints: [{ networkClientId: 'sepolia' }],
      },
      [CHAIN_IDS.LINEA_SEPOLIA]: {
        chainId: CHAIN_IDS.LINEA_SEPOLIA,
        defaultRpcEndpointIndex: 0,
        rpcEndpoints: [{ networkClientId: 'linea-sepolia' }],
      },
    };

    beforeEach(() => {
      process.env.PORTFOLIO_VIEW = 'true';
    });

    afterEach(() => {
      process.env.PORTFOLIO_VIEW = undefined;
    });

    it('returns only non-test chain IDs', () => {
      const chainIds = selectors.getNetworkClientIdsToPoll({
        metamask: {
          enabledNetworkMap: {
            eip155: {
              [CHAIN_IDS.MAINNET]: true,
              [CHAIN_IDS.LINEA_MAINNET]: true,
            },
          },
          networkConfigurationsByChainId,
          selectedNetworkClientId: 'mainnet',
          multichainNetworkConfigurationsByChainId:
            AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS,
          selectedMultichainNetworkChainId: 'eip155:1',
          isEvmSelected: true,
        },
      });
      expect(Object.values(chainIds)).toHaveLength(2);
      expect(chainIds).toStrictEqual(['mainnet', 'linea-mainnet']);
    });
  });

  describe('#isHardwareWallet', () => {
    it('returns false if it is not a HW wallet', () => {
      const mockStateWithImported = modifyStateWithHWKeyring(
        KeyringType.imported,
      );
      expect(selectors.isHardwareWallet(mockStateWithImported)).toBe(false);
    });

    it('returns true if it is a Ledger HW wallet', () => {
      const mockStateWithLedger = modifyStateWithHWKeyring(KeyringType.ledger);
      expect(selectors.isHardwareWallet(mockStateWithLedger)).toBe(true);
    });

    it('returns true if it is a Trezor HW wallet', () => {
      const mockStateWithTrezor = modifyStateWithHWKeyring(KeyringType.trezor);
      expect(selectors.isHardwareWallet(mockStateWithTrezor)).toBe(true);
    });

    it('returns true if it is a Lattice HW wallet', () => {
      const mockStateWithLattice = modifyStateWithHWKeyring(
        KeyringType.lattice,
      );
      expect(selectors.isHardwareWallet(mockStateWithLattice)).toBe(true);
    });

    it('returns true if it is a QR HW wallet', () => {
      const mockStateWithQr = modifyStateWithHWKeyring(KeyringType.qr);
      expect(selectors.isHardwareWallet(mockStateWithQr)).toBe(true);
    });
  });

  describe('#accountSupportsSmartTx', () => {
    it('returns false if the account type is "snap"', () => {
      const state = {
        metamask: {
          internalAccounts: {
            accounts: {
              'mock-id-1': {
                address: '0x987654321',
                metadata: {
                  name: 'Account 1',
                  keyring: {
                    type: 'Snap Keyring',
                  },
                },
              },
            },
            selectedAccount: 'mock-id-1',
          },
        },
      };
      expect(selectors.accountSupportsSmartTx(state)).toBe(false);
    });

    it('returns true if the account type is not "snap"', () => {
      expect(selectors.accountSupportsSmartTx(mockState)).toBe(true);
    });
  });

  describe('#getHardwareWalletType', () => {
    it('returns undefined if it is not a HW wallet', () => {
      const mockStateWithImported = modifyStateWithHWKeyring(
        KeyringType.imported,
      );
      expect(
        selectors.getHardwareWalletType(mockStateWithImported),
      ).toBeUndefined();
    });

    it('returns "Ledger Hardware" if it is a Ledger HW wallet', () => {
      const mockStateWithLedger = modifyStateWithHWKeyring(KeyringType.ledger);
      expect(selectors.getHardwareWalletType(mockStateWithLedger)).toBe(
        KeyringType.ledger,
      );
    });

    it('returns "Trezor Hardware" if it is a Trezor HW wallet', () => {
      const mockStateWithTrezor = modifyStateWithHWKeyring(KeyringType.trezor);
      expect(selectors.getHardwareWalletType(mockStateWithTrezor)).toBe(
        KeyringType.trezor,
      );
    });
  });

  it('returns selected account', () => {
    const account = selectors.getSelectedAccount(mockState);
    expect(account.balance).toStrictEqual('0x346ba7725f412cbfdb');
    expect(account.address).toStrictEqual(
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
    );
  });

  describe('#getTokenExchangeRates', () => {
    it('returns token exchange rates', () => {
      const tokenExchangeRates = selectors.getTokenExchangeRates(mockState);
      expect(tokenExchangeRates).toStrictEqual({
        '0x108cf70c7d384c552f42c07c41c0e1e46d77ea0d': 0.00039345803819379796,
        '0xd8f6a2ffb0fc5952d16c9768b71cfd35b6399aa5': 0.00008189274407698049,
        '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': 0.0017123,
        '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 0.0000000018,
      });
    });
  });

  describe('#checkNetworkOrAccountNotSupports1559', () => {
    it('returns false if network and account supports EIP-1559', () => {
      const not1559Network = selectors.checkNetworkOrAccountNotSupports1559({
        ...mockState,
        metamask: {
          ...mockState.metamask,
          ...mockNetworkState({
            chainId: CHAIN_IDS.GOERLI,
            metadata: { EIPS: { 1559: true } },
          }),
          keyrings: [
            {
              type: KeyringType.ledger,
              accounts: ['0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'],
              metadata: {
                name: 'Ledger',
                id: 'ledger',
              },
            },
          ],
        },
      });
      expect(not1559Network).toStrictEqual(false);
    });

    it('returns true if network does not support EIP-1559', () => {
      const not1559Network = selectors.checkNetworkOrAccountNotSupports1559({
        ...mockState,
        metamask: {
          ...mockState.metamask,
          ...mockNetworkState({
            chainId: CHAIN_IDS.GOERLI,
            metadata: { EIPS: { 1559: false } },
          }),
        },
      });
      expect(not1559Network).toStrictEqual(true);
    });
  });

  describe('#getAddressBook', () => {
    it('should return the address book', () => {
      expect(selectors.getAddressBook(mockState)).toStrictEqual([
        {
          address: '0xc42edfcc21ed14dda456aa0756c153f7985d8813',
          chainId: '0x5',
          isEns: false,
          memo: '',
          name: 'Address Book Account 1',
        },
      ]);
    });
  });

  it('returns accounts with balance, address, and name from identity and accounts in state', () => {
    const accountsWithSendEther =
      selectors.accountsWithSendEtherInfoSelector(mockState);
    expect(accountsWithSendEther).toHaveLength(6);
    expect(accountsWithSendEther[0].balance).toStrictEqual(
      '0x346ba7725f412cbfdb',
    );
    expect(accountsWithSendEther[0].address).toStrictEqual(
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
    );
    expect(accountsWithSendEther[0].metadata.name).toStrictEqual(
      'Test Account',
    );
  });

  it('returns selected account with balance, address, and name from accountsWithSendEtherInfoSelector', () => {
    const currentAccountwithSendEther =
      selectors.getCurrentAccountWithSendEtherInfo(mockState);
    expect(currentAccountwithSendEther.balance).toStrictEqual(
      '0x346ba7725f412cbfdb',
    );
    expect(currentAccountwithSendEther.address).toStrictEqual(
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
    );
    expect(currentAccountwithSendEther.metadata.name).toStrictEqual(
      'Test Account',
    );
  });

  it('#getTotalUnapprovedCount', () => {
    const totalUnapprovedCount = selectors.getTotalUnapprovedCount(mockState);
    expect(totalUnapprovedCount).toStrictEqual(1);
  });

  it('#getUseTokenDetection', () => {
    const useTokenDetection = selectors.getUseTokenDetection(mockState);
    expect(useTokenDetection).toStrictEqual(true);
  });

  it('#getTokenList', () => {
    const tokenList = selectors.getTokenList(mockState);
    expect(tokenList).toStrictEqual({
      '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': {
        address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
        symbol: 'WBTC',
        decimals: 8,
        name: 'Wrapped Bitcoin',
        iconUrl: 'https://s3.amazonaws.com/airswap-token-images/WBTC.png',
        aggregators: [
          'airswapLight',
          'bancor',
          'cmc',
          'coinGecko',
          'kleros',
          'oneInch',
          'paraswap',
          'pmm',
          'totle',
          'zapper',
          'zerion',
          'zeroEx',
        ],
        occurrences: 12,
      },
      '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e': {
        address: '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e',
        symbol: 'YFI',
        decimals: 18,
        name: 'yearn.finance',
        iconUrl:
          'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e/logo.png',
        aggregators: [
          'airswapLight',
          'bancor',
          'cmc',
          'coinGecko',
          'kleros',
          'oneInch',
          'paraswap',
          'pmm',
          'totle',
          'zapper',
          'zerion',
          'zeroEx',
        ],
        occurrences: 12,
      },
    });
  });
  it('#getAdvancedGasFeeValues', () => {
    const advancedGasFee = selectors.getAdvancedGasFeeValues(mockState);
    expect(advancedGasFee).toStrictEqual({
      maxBaseFee: '75',
      priorityFee: '2',
    });
  });
  it('#getAppIsLoading', () => {
    const appIsLoading = selectors.getAppIsLoading(mockState);
    expect(appIsLoading).toStrictEqual(false);
  });

  it('#getUseCurrencyRateCheck', () => {
    const useCurrencyRateCheck = selectors.getUseCurrencyRateCheck(mockState);
    expect(useCurrencyRateCheck).toStrictEqual(true);
  });

  it('#getShowOutdatedBrowserWarning returns false if outdatedBrowserWarningLastShown is less than 2 days ago', () => {
    mockState.metamask.showOutdatedBrowserWarning = true;
    const timestamp = new Date();
    timestamp.setDate(timestamp.getDate() - 1);
    mockState.metamask.outdatedBrowserWarningLastShown = timestamp.getTime();
    const showOutdatedBrowserWarning =
      selectors.getShowOutdatedBrowserWarning(mockState);
    expect(showOutdatedBrowserWarning).toStrictEqual(false);
  });

  it('#getShowOutdatedBrowserWarning returns true if outdatedBrowserWarningLastShown is more than 2 days ago', () => {
    mockState.metamask.showOutdatedBrowserWarning = true;
    const timestamp = new Date();
    timestamp.setDate(timestamp.getDate() - 3);
    mockState.metamask.outdatedBrowserWarningLastShown = timestamp.getTime();
    const showOutdatedBrowserWarning =
      selectors.getShowOutdatedBrowserWarning(mockState);
    expect(showOutdatedBrowserWarning).toStrictEqual(true);
  });

  it('#getIsBridgeChain', () => {
    const isOptimismSupported = selectors.getIsBridgeChain({
      metamask: {
        ...mockNetworkState({ chainId: CHAIN_IDS.OPTIMISM }),
        internalAccounts: {
          selectedAccount: '0xabc',
          accounts: { '0xabc': { metadata: { keyring: {} } } },
        },
      },
    });
    expect(isOptimismSupported).toBeTruthy();

    const isFantomSupported = selectors.getIsBridgeChain({
      metamask: {
        ...mockNetworkState({ chainId: CHAIN_IDS.FANTOM }),
        internalAccounts: {
          selectedAccount: '0xabc',
          accounts: { '0xabc': { metadata: { keyring: {} } } },
        },
      },
    });
    expect(isFantomSupported).toBeFalsy();

    const isSolanaSupported = selectors.getIsBridgeChain({
      metamask: {
        ...mockNetworkState({ chainId: MultichainNetworks.SOLANA }),
        internalAccounts: {
          selectedAccount: '0xabc',
          accounts: {
            '0xabc': { metadata: { keyring: {} } },
            type: 'solana',
          },
        },
      },
    });
    expect(isSolanaSupported).toBeTruthy();
  });

  it('returns proper values for snaps privacy warning shown status', () => {
    mockState.metamask.snapsInstallPrivacyWarningShown = false;
    expect(selectors.getSnapsInstallPrivacyWarningShown(mockState)).toBe(false);

    mockState.metamask.snapsInstallPrivacyWarningShown = true;
    expect(selectors.getSnapsInstallPrivacyWarningShown(mockState)).toBe(true);

    mockState.metamask.snapsInstallPrivacyWarningShown = undefined;
    expect(selectors.getSnapsInstallPrivacyWarningShown(mockState)).toBe(false);

    mockState.metamask.snapsInstallPrivacyWarningShown = null;
    expect(selectors.getSnapsInstallPrivacyWarningShown(mockState)).toBe(false);
  });

  it('#getSnapRegistryData', () => {
    const mockSnapId = 'npm:@metamask/test-snap-bip44';
    expect(selectors.getSnapRegistryData(mockState, mockSnapId)).toStrictEqual(
      expect.objectContaining({
        id: mockSnapId,
        versions: {
          '5.1.2': {
            checksum: 'L1k+dT9Q+y3KfIqzaH09MpDZVPS9ZowEh9w01ZMTWMU=',
          },
          '5.1.3': {
            checksum: '21k+dT9Q+y3KfIqzaH09MpDZVPS9ZowEh9w01ZMTWMU=',
          },
          '6.0.0': {
            checksum: '31k+dT9Q+y3KfIqzaH09MpDZVPS9ZowEh9w01ZMTWMU=',
          },
        },
        metadata: expect.objectContaining({
          website: 'https://snaps.consensys.io/',
          name: 'BIP-44',
        }),
      }),
    );
  });

  it('#getSnapLatestVersion', () => {
    const mockSnapId = 'npm:@metamask/test-snap-bip44';
    expect(selectors.getSnapLatestVersion(mockState, mockSnapId)).toStrictEqual(
      '6.0.0',
    );
  });

  it('#getAllSnapAvailableUpdates', () => {
    const snapMap = selectors.getAllSnapAvailableUpdates(mockState);
    expect(Object.fromEntries(snapMap)).toStrictEqual({
      'npm:@metamask/test-snap-bip32': false,
      'npm:@metamask/test-snap-bip44': true,
      'npm:@metamask/test-snap-dialog': false,
      'npm:@metamask/test-snap-getEntropy': false,
      'npm:@metamask/test-snap-networkAccess': false,
      'npm:@metamask/test-snap-notify': false,
      'npm:@metamask/test-snap-wasm': false,
      'local:snap-id': false,
    });
  });

  it('#getAnySnapUpdateAvailable', () => {
    expect(selectors.getAnySnapUpdateAvailable(mockState)).toStrictEqual(true);
  });

  it('#getTargetSubjectMetadata', () => {
    const targetSubjectsMetadata = selectors.getTargetSubjectMetadata(
      mockState,
      'npm:@metamask/test-snap-bip44',
    );
    expect(targetSubjectsMetadata).toStrictEqual({
      iconUrl: null,
      name: '@metamask/test-snap-bip44',
      subjectType: 'snap',
      version: '1.2.3',
    });
  });

  it('#getMultipleTargetsSubjectMetadata', () => {
    const targetSubjectsMetadata = selectors.getMultipleTargetsSubjectMetadata(
      mockState,
      {
        'npm:@metamask/test-snap-bip44': {},
        'https://snaps.metamask.io': {},
      },
    );
    expect(targetSubjectsMetadata).toStrictEqual({
      'https://snaps.metamask.io': {
        extensionId: null,
        iconUrl:
          'https://snaps.metamask.io/favicon-32x32.png?v=96e4834dade94988977ec34e50a62b84',
        name: 'MetaMask Snaps Directory',
        origin: 'https://snaps.metamask.io',
        subjectType: 'website',
      },
      'npm:@metamask/test-snap-bip44': {
        iconUrl: null,
        name: '@metamask/test-snap-bip44',
        subjectType: 'snap',
        version: '1.2.3',
      },
    });
  });

  it('#getUpdatedAndSortedAccounts', () => {
    const pinnedAccountState = {
      ...mockState,
      metamask: {
        ...mockState.metamask,
        pinnedAccountList: [
          '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b',
          '0xeb9e64b93097bc15f01f13eae97015c57ab64823',
        ],
        accounts: {
          '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
            address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
            balance: '0x0',
          },
          '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b': {
            address: '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b',
            balance: '0x0',
          },
          '0xc42edfcc21ed14dda456aa0756c153f7985d8813': {
            address: '0xc42edfcc21ed14dda456aa0756c153f7985d8813',
            balance: '0x0',
          },
          '0xeb9e64b93097bc15f01f13eae97015c57ab64823': {
            address: '0xeb9e64b93097bc15f01f13eae97015c57ab64823',
            balance: '0x0',
          },
          '0xca8f1F0245530118D0cf14a06b01Daf8f76Cf281': {
            address: '0xca8f1F0245530118D0cf14a06b01Daf8f76Cf281',
            balance: '0x0',
          },
        },
        accountsByChainId: {
          '0x5': {
            '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
              address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
              balance: '0x0',
            },
            '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b': {
              address: '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b',
              balance: '0x0',
            },
            '0xc42edfcc21ed14dda456aa0756c153f7985d8813': {
              address: '0xc42edfcc21ed14dda456aa0756c153f7985d8813',
              balance: '0x0',
            },
            '0xeb9e64b93097bc15f01f13eae97015c57ab64823': {
              address: '0xeb9e64b93097bc15f01f13eae97015c57ab64823',
              balance: '0x0',
            },
            '0xca8f1F0245530118D0cf14a06b01Daf8f76Cf281': {
              address: '0xca8f1F0245530118D0cf14a06b01Daf8f76Cf281',
              balance: '0x0',
            },
          },
        },
        permissionHistory: {
          'https://test.dapp': {
            eth_accounts: {
              accounts: {
                '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': 1596681857076,
              },
            },
          },
        },
        subjects: {
          'https://test.dapp': {
            permissions: {
              'endowment:caip25': {
                caveats: [
                  {
                    type: 'authorizedScopes',
                    value: {
                      requiredScopes: {},
                      optionalScopes: {
                        'eip155:1': {
                          accounts: [
                            'eip155:1:0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
                          ],
                        },
                      },
                      isMultichainOrigin: false,
                    },
                  },
                ],
                invoker: 'https://test.dapp',
                parentCapability: 'endowment:caip25',
              },
            },
          },
        },
      },
      activeTab: {
        origin: 'https://test.dapp',
      },
      unconnectedAccount: {
        state: 'OPEN',
      },
    };
    const expectedResult = [
      {
        address: '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b',
        balance: '0x0',
        id: '07c2cfec-36c9-46c4-8115-3836d3ac9047',
        metadata: {
          importTime: 0,
          name: 'Test Account 2',
          keyring: {
            type: 'HD Key Tree',
          },
        },
        options: {
          entropySource: '01JKAF3DSGM3AB87EM9N0K41AJ',
        },
        methods: [
          'personal_sign',
          'eth_signTransaction',
          'eth_signTypedData_v1',
          'eth_signTypedData_v3',
          'eth_signTypedData_v4',
        ],
        type: 'eip155:eoa',
        scopes: ['eip155:0'],
        pinned: true,
        hidden: false,
        active: false,
      },

      {
        address: '0xeb9e64b93097bc15f01f13eae97015c57ab64823',
        balance: '0x0',
        id: '784225f4-d30b-4e77-a900-c8bbce735b88',
        metadata: {
          importTime: 0,
          name: 'Test Account 3',
          keyring: {
            type: 'HD Key Tree',
          },
        },
        options: {
          entropySource: '01JKAF3PJ247KAM6C03G5Q0NP8',
        },
        methods: [
          'personal_sign',
          'eth_signTransaction',
          'eth_signTypedData_v1',
          'eth_signTypedData_v3',
          'eth_signTypedData_v4',
        ],
        type: 'eip155:eoa',
        scopes: ['eip155:0'],
        pinned: true,
        hidden: false,
        active: false,
      },

      {
        address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
        metadata: {
          importTime: 0,
          name: 'Test Account',
          keyring: {
            type: 'HD Key Tree',
          },
        },
        options: {
          entropySource: '01JKAF3DSGM3AB87EM9N0K41AJ',
        },
        methods: [
          'personal_sign',
          'eth_signTransaction',
          'eth_signTypedData_v1',
          'eth_signTypedData_v3',
          'eth_signTypedData_v4',
        ],
        type: 'eip155:eoa',
        scopes: ['eip155:0'],
        balance: '0x0',
        pinned: false,
        hidden: false,
        active: false,
        connections: true,
        lastSelected: undefined,
      },
      {
        address: '0xc42edfcc21ed14dda456aa0756c153f7985d8813',
        id: '15e69915-2a1a-4019-93b3-916e11fd432f',
        metadata: {
          importTime: 0,
          name: 'Ledger Hardware 2',
          keyring: {
            type: 'Ledger Hardware',
          },
        },
        options: {},
        methods: [
          'personal_sign',
          'eth_signTransaction',
          'eth_signTypedData_v1',
          'eth_signTypedData_v3',
          'eth_signTypedData_v4',
        ],
        type: 'eip155:eoa',
        scopes: ['eip155:0'],
        balance: '0x0',
        pinned: false,
        hidden: false,
        active: false,
      },
      {
        address: '0xb552685e3d2790efd64a175b00d51f02cdafee5d',
        balance: '0x0',
        id: 'c3deeb99-ba0d-4a4e-a0aa-033fc1f79ae3',
        metadata: {
          keyring: {
            type: 'Snap Keyring',
          },
          importTime: 0,
          name: 'Snap Account 1',
          snap: {
            enabled: true,
            id: 'local:snap-id',
            name: 'snap-name',
          },
        },
        methods: [
          'personal_sign',
          'eth_signTransaction',
          'eth_signTypedData_v1',
          'eth_signTypedData_v3',
          'eth_signTypedData_v4',
        ],
        options: {},
        hidden: false,
        pinned: false,
        active: false,
        type: 'eip155:eoa',
        scopes: ['eip155:0'],
      },
      {
        id: '694225f4-d30b-4e77-a900-c8bbce735b42',
        metadata: {
          importTime: 0,
          name: 'Test Account 4',
          keyring: {
            type: 'Custody test',
          },
        },
        options: {},
        methods: [
          'personal_sign',
          'eth_signTransaction',
          'eth_signTypedData_v1',
          'eth_signTypedData_v3',
          'eth_signTypedData_v4',
        ],
        type: 'eip155:eoa',
        scopes: ['eip155:0'],
        address: '0xca8f1F0245530118D0cf14a06b01Daf8f76Cf281',
        balance: '0x0',
        pinned: false,
        hidden: false,
        active: false,
      },
    ];
    expect(
      selectors.getUpdatedAndSortedAccounts(pinnedAccountState),
    ).toStrictEqual(expectedResult);
  });
});

describe('#getKeyringSnapAccounts', () => {
  it('returns an empty array if no keyring snap accounts exist', () => {
    const state = {
      metamask: {
        internalAccounts: {
          accounts: {
            1: {
              address: '0x123456789',
              metadata: {
                name: 'Account 1',
                keyring: {
                  type: 'HD Key Tree',
                },
              },
            },
            2: {
              address: '0x987654321',
              metadata: {
                name: 'Account 2',
                keyring: {
                  type: 'Simple Key Pair',
                },
              },
            },
          },
        },
      },
    };

    expect(selectors.getKeyringSnapAccounts(state)).toStrictEqual([]);
  });

  it('returns an array of keyring snap accounts', () => {
    const state = {
      metamask: {
        internalAccounts: {
          accounts: {
            'mock-id-1': {
              address: '0x123456789',
              metadata: {
                name: 'Account 1',
                keyring: {
                  type: 'Ledger',
                },
              },
            },
            'mock-id-2': {
              address: '0x987654321',
              metadata: {
                name: 'Account 2',
                keyring: {
                  type: 'Snap Keyring',
                },
              },
            },
            'mock-id-3': {
              address: '0xabcdef123',
              metadata: {
                name: 'Account 3',
                keyring: {
                  type: 'Snap Keyring',
                },
              },
            },
          },
        },
      },
    };

    expect(selectors.getKeyringSnapAccounts(state)).toStrictEqual([
      {
        address: '0x987654321',
        metadata: {
          name: 'Account 2',
          keyring: {
            type: 'Snap Keyring',
          },
        },
      },
      {
        address: '0xabcdef123',
        metadata: {
          name: 'Account 3',
          keyring: {
            type: 'Snap Keyring',
          },
        },
      },
    ]);
  });
});
describe('#getConnectedSitesListWithNetworkInfo', () => {
  it('returns the sites list with network information', () => {
    const sitesList = {
      site1: {
        id: 'site1',
      },
      site2: {
        id: 'site2',
      },
    };

    const domains = {
      site1: 'network1',
      site2: 'network2',
    };

    const networks = [
      {
        id: 'network1',
        chainId: '0x1',
        name: 'Network 1',
        rpcEndpoints: [
          {
            networkClientId: 'network1',
          },
        ],
      },
      {
        id: 'network2',
        chainId: '0x38',
        name: 'Network 2',
        rpcEndpoints: [
          {
            networkClientId: 'network2',
          },
        ],
      },
    ];

    const expectedSitesList = {
      site1: {
        id: 'site1',
        networkIconUrl: './images/eth_logo.svg',
        networkName: 'Network 1',
      },
      site2: {
        id: 'site2',
        networkIconUrl: './images/bnb.svg',
        networkName: 'Network 2',
      },
    };

    const result = selectors.getConnectedSitesListWithNetworkInfo.resultFunc(
      sitesList,
      domains,
      networks,
    );

    expect(result).toStrictEqual(expectedSitesList);
  });
});
describe('#getConnectedSitesList', () => {
  it('returns an empty object if there are no connected addresses', () => {
    const connectedSubjectsForAllAddresses = {};
    const internalAccounts = [];
    const connectedAddresses = [];

    const result = selectors.getConnectedSitesList.resultFunc(
      connectedSubjectsForAllAddresses,
      internalAccounts,
      connectedAddresses,
    );

    expect(result).toStrictEqual({});
  });

  it('returns the correct sites list with addresses and name mappings', () => {
    const connectedSubjectsForAllAddresses = {
      '0x123': [
        { origin: 'site1', name: 'Site 1' },
        { origin: 'site2', name: 'Site 2' },
      ],
      '0x456': [
        { origin: 'site1', name: 'Site 1' },
        { origin: 'site3', name: 'Site 3' },
      ],
    };

    const mockInternalAccount1 = createMockInternalAccount({
      address: '0x123',
      name: 'John Doe',
    });
    const mockInternalAccount2 = createMockInternalAccount({
      address: '0x456',
      name: 'Jane Smith',
    });

    const internalAccounts = [mockInternalAccount1, mockInternalAccount2];

    const connectedAddresses = ['0x123', '0x456'];

    const result = selectors.getConnectedSitesList.resultFunc(
      connectedSubjectsForAllAddresses,
      internalAccounts,
      connectedAddresses,
    );

    expect(result).toStrictEqual({
      site1: {
        origin: 'site1',
        addresses: ['0x123', '0x456'],
        addressToNameMap: {
          '0x123': 'John Doe',
          '0x456': 'Jane Smith',
        },
        name: 'Site 1',
      },
      site2: {
        origin: 'site2',
        addresses: ['0x123'],
        addressToNameMap: {
          '0x123': 'John Doe',
        },
        name: 'Site 2',
      },
      site3: {
        origin: 'site3',
        addresses: ['0x456'],
        addressToNameMap: {
          '0x456': 'Jane Smith',
        },
        name: 'Site 3',
      },
    });
  });
  describe('#getShowDeleteMetaMetricsDataModal', () => {
    it('returns state of showDeleteMetaMetricsDataModal', () => {
      expect(
        selectors.getShowDeleteMetaMetricsDataModal({
          appState: {
            showDeleteMetaMetricsDataModal: true,
          },
        }),
      ).toStrictEqual(true);
    });
  });
  describe('#getShowDataDeletionErrorModal', () => {
    it('returns state of showDataDeletionErrorModal', () => {
      expect(
        selectors.getShowDataDeletionErrorModal({
          appState: {
            showDataDeletionErrorModal: true,
          },
        }),
      ).toStrictEqual(true);
    });
  });
  describe('#getMetaMetricsDataDeletionId', () => {
    it('returns metaMetricsDataDeletionId', () => {
      expect(
        selectors.getMetaMetricsDataDeletionId({
          metamask: {
            metaMetricsDataDeletionId: '123',
            metaMetricsDataDeletionTimestamp: '123345',
            metaMetricsDataDeletionStatus: DeleteRegulationStatus.Initialized,
          },
        }),
      ).toStrictEqual('123');
    });
  });
  describe('#getMetaMetricsDataDeletionTimestamp', () => {
    it('returns metaMetricsDataDeletionTimestamp', () => {
      expect(
        selectors.getMetaMetricsDataDeletionTimestamp({
          metamask: {
            metaMetricsDataDeletionId: '123',
            metaMetricsDataDeletionTimestamp: '123345',
            metaMetricsDataDeletionStatus: DeleteRegulationStatus.Initialized,
          },
        }),
      ).toStrictEqual('123345');
    });
  });
  describe('#getMetaMetricsDataDeletionStatus', () => {
    it('returns metaMetricsDataDeletionStatus', () => {
      expect(
        selectors.getMetaMetricsDataDeletionStatus({
          metamask: {
            metaMetricsDataDeletionId: '123',
            metaMetricsDataDeletionTimestamp: '123345',
            metaMetricsDataDeletionStatus: DeleteRegulationStatus.Initialized,
          },
        }),
      ).toStrictEqual('INITIALIZED');
    });
  });

  describe('getEvmInternalAccounts', () => {
    const account1 = createMockInternalAccount({
      keyringType: KeyringType.hd,
    });
    const account2 = createMockInternalAccount({
      type: EthAccountType.Erc4337,
      keyringType: KeyringType.snap,
    });
    const account3 = createMockInternalAccount({
      keyringType: KeyringType.imported,
    });
    const account4 = createMockInternalAccount({
      keyringType: KeyringType.ledger,
    });
    const account5 = createMockInternalAccount({
      keyringType: KeyringType.trezor,
    });
    const nonEvmAccount1 = createMockInternalAccount({
      type: BtcAccountType.P2wpkh,
      keyringType: KeyringType.snap,
    });
    const nonEvmAccount2 = createMockInternalAccount({
      type: BtcAccountType.P2wpkh,
      keyringType: KeyringType.snap,
    });

    const evmAccounts = [account1, account2, account3, account4, account5];

    it('returns all EVM accounts when only EVM accounts are present', () => {
      const state = mockAccountsState(evmAccounts);
      expect(selectors.getEvmInternalAccounts(state)).toStrictEqual(
        evmAccounts,
      );
    });

    it('only returns EVM accounts when there are non-EVM accounts', () => {
      const state = mockAccountsState([
        ...evmAccounts,
        nonEvmAccount1,
        nonEvmAccount2,
      ]);
      expect(selectors.getEvmInternalAccounts(state)).toStrictEqual(
        evmAccounts,
      );
    });

    it('returns an empty array when there are no EVM accounts', () => {
      const state = mockAccountsState([nonEvmAccount1, nonEvmAccount2]);
      expect(selectors.getEvmInternalAccounts(state)).toStrictEqual([]);
    });
  });

  describe('getSelectedEvmInternalAccount', () => {
    const account1 = createMockInternalAccount({
      lastSelected: 1,
    });
    const account2 = createMockInternalAccount({
      lastSelected: 2,
    });
    const account3 = createMockInternalAccount({
      lastSelected: 3,
    });
    const nonEvmAccount1 = createMockInternalAccount({
      type: BtcAccountType.P2wpkh,
      keyringType: KeyringType.snap,
      lastSelected: 4,
    });
    const nonEvmAccount2 = createMockInternalAccount({
      type: BtcAccountType.P2wpkh,
      keyringType: KeyringType.snap,
      lastSelected: 5,
    });

    it('returns the last selected EVM account', () => {
      const state = mockAccountsState([account1, account2, account3]);
      expect(selectors.getSelectedEvmInternalAccount(state)).toBe(account3);
    });

    it('returns the last selected EVM account when there are non-EVM accounts', () => {
      const state = mockAccountsState([
        account1,
        account2,
        account3,
        nonEvmAccount1,
        nonEvmAccount2,
      ]);
      expect(selectors.getSelectedEvmInternalAccount(state)).toBe(account3);
    });

    it('returns `undefined` if there are no EVM accounts', () => {
      const state = mockAccountsState([nonEvmAccount1, nonEvmAccount2]);
      expect(selectors.getSelectedEvmInternalAccount(state)).toBe(undefined);
    });
  });

  describe('getSwapsDefaultToken', () => {
    it('returns the token object for the current chainId when no overrideChainId is provided', () => {
      const expectedToken = {
        symbol: 'ETH',
        name: 'Ether',
        address: '0x0000000000000000000000000000000000000000',
        decimals: 18,
        balance: '966987986469506564059',
        string: '966.988',
        iconUrl: './images/black-eth-logo.svg',
        chainId: '0x5',
      };

      const result = selectors.getSwapsDefaultToken(mockState);

      expect(result).toStrictEqual(expectedToken);
    });

    it('returns the token object for the overridden chainId when overrideChainId is provided', () => {
      const getCurrentChainIdSpy = jest.spyOn(
        networkSelectors,
        'getCurrentChainId',
      );
      const expectedToken = {
        symbol: 'POL',
        name: 'Polygon',
        address: '0x0000000000000000000000000000000000000000',
        decimals: 18,
        balance: '966987986469506564059',
        string: '966.988',
        iconUrl: './images/pol-token.svg',
        chainId: '0x89',
      };

      const result = selectors.getSwapsDefaultToken(
        mockState,
        CHAIN_IDS.POLYGON,
      );

      expect(result).toStrictEqual(expectedToken);
      expect(getCurrentChainIdSpy).not.toHaveBeenCalled(); // Ensure overrideChainId is used
    });
  });

  describe('getIsSwapsChain', () => {
    it('returns true for an allowed chainId in production environment', () => {
      process.env.METAMASK_ENVIRONMENT = 'production';

      const state = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          selectedNetworkClientId: 'testNetworkConfigurationId', // corresponds to mainnet RPC in mockState
        },
      };

      const result = selectors.getIsSwapsChain(state);

      expect(result).toBe(true);
    });

    it('returns true for an allowed chainId in development environment', () => {
      process.env.METAMASK_ENVIRONMENT = 'development';

      const state = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          selectedNetworkClientId: 'goerli',
        },
      };

      const result = selectors.getIsSwapsChain(state);

      expect(result).toBe(true);
    });

    it('returns false for a disallowed chainId in production environment', () => {
      process.env.METAMASK_ENVIRONMENT = 'production';

      const state = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          selectedNetworkClientId: 'fooChain', // corresponds to mainnet RPC in mockState
          networkConfigurationsByChainId: {
            '0x8080': {
              chainId: '0x8080',
              name: 'Custom Mainnet RPC',
              nativeCurrency: 'ETH',
              defaultRpcEndpointIndex: 0,
              rpcEndpoints: [
                {
                  type: 'custom',
                  url: 'https://testrpc.com',
                  networkClientId: 'fooChain',
                },
              ],
            },
          },
        },
      };

      const result = selectors.getIsSwapsChain(state);

      expect(result).toBe(false);
    });

    it('returns false for a disallowed chainId in development environment', () => {
      process.env.METAMASK_ENVIRONMENT = 'development';

      const state = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          selectedNetworkClientId: 'fooChain', // corresponds to mainnet RPC in mockState
          networkConfigurationsByChainId: {
            '0x8080': {
              chainId: '0x8080',
              name: 'Custom Mainnet RPC',
              nativeCurrency: 'ETH',
              defaultRpcEndpointIndex: 0,
              rpcEndpoints: [
                {
                  type: 'custom',
                  url: 'https://testrpc.com',
                  networkClientId: 'fooChain',
                },
              ],
            },
          },
        },
      };

      const result = selectors.getIsSwapsChain(state);

      expect(result).toBe(false);
    });

    it('respects the overrideChainId parameter', () => {
      process.env.METAMASK_ENVIRONMENT = 'production';

      const getCurrentChainIdSpy = jest.spyOn(
        networkSelectors,
        'getCurrentChainId',
      );

      const result = selectors.getIsSwapsChain(mockState, '0x89');
      expect(result).toBe(true);
      expect(getCurrentChainIdSpy).not.toHaveBeenCalled(); // Ensure overrideChainId is used
    });
  });

  describe('getIsBridgeChain', () => {
    it('returns true for an allowed bridge chainId', () => {
      const state = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          selectedNetworkClientId: 'testNetworkConfigurationId', // corresponds to mainnet RPC in mockState
        },
      };

      const result = selectors.getIsBridgeChain(state);

      expect(result).toBe(true);
    });

    it('returns false for a disallowed bridge chainId', () => {
      const state = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          selectedNetworkClientId: 'fooChain', // corresponds to mainnet RPC in mockState
          networkConfigurationsByChainId: {
            '0x8080': {
              chainId: '0x8080',
              name: 'Custom Mainnet RPC',
              nativeCurrency: 'ETH',
              defaultRpcEndpointIndex: 0,
              rpcEndpoints: [
                {
                  type: 'custom',
                  url: 'https://testrpc.com',
                  networkClientId: 'fooChain',
                },
              ],
            },
          },
        },
      };

      const result = selectors.getIsBridgeChain(state);

      expect(result).toBe(false);
    });

    it('respects the overrideChainId parameter', () => {
      const getCurrentChainIdSpy = jest.spyOn(
        networkSelectors,
        'getCurrentChainId',
      );

      const result = selectors.getIsBridgeChain(mockState, '0x89');

      expect(result).toBe(true);
      expect(getCurrentChainIdSpy).not.toHaveBeenCalled(); // Ensure overrideChainId is used
    });
  });

  describe('getIsTokenNetworkFilterEqualCurrentNetwork', () => {
    beforeEach(() => {
      process.env.PORTFOLIO_VIEW = 'true';
    });

    afterEach(() => {
      process.env.PORTFOLIO_VIEW = undefined;
    });

    it('returns true when the token network filter is equal to the current network', () => {
      const state = {
        metamask: {
          enabledNetworkMap: {
            eip155: {
              '0x1': true,
            },
          },
          preferences: {
            tokenNetworkFilter: {
              '0x1': true,
            },
          },
          selectedNetworkClientId: 'mainnetNetworkConfigurationId',
          networkConfigurationsByChainId: {
            '0x1': {
              chainId: '0x1',
              rpcEndpoints: [
                { networkClientId: 'mainnetNetworkConfigurationId' },
              ],
            },
          },
          multichainNetworkConfigurationsByChainId:
            AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS,
          selectedMultichainNetworkChainId: 'eip155:1',
          isEvmSelected: true,
        },
      };
      expect(selectors.getIsTokenNetworkFilterEqualCurrentNetwork(state)).toBe(
        true,
      );
    });

    it('returns false when the token network filter is on multiple networks', () => {
      const state = {
        metamask: {
          enabledNetworkMap: {
            eip155: {
              '0x1': true,
              '0x89': true,
            },
          },
          selectedNetworkClientId: 'mainnetNetworkConfigurationId',
          networkConfigurationsByChainId: {
            '0x1': {
              chainId: '0x1',
              rpcEndpoints: [
                { networkClientId: 'mainnetNetworkConfigurationId' },
              ],
            },
          },
          multichainNetworkConfigurationsByChainId:
            AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS,
          selectedMultichainNetworkChainId: 'eip155:1',
          isEvmSelected: true,
        },
      };
      expect(selectors.getIsTokenNetworkFilterEqualCurrentNetwork(state)).toBe(
        false,
      );
    });
  });

  describe('getTokenNetworkFilter', () => {
    beforeEach(() => {
      process.env.PORTFOLIO_VIEW = 'true';
    });

    afterEach(() => {
      process.env.PORTFOLIO_VIEW = undefined;
    });

    it('always returns an object containing the network if portfolio view is disabled', () => {
      process.env.PORTFOLIO_VIEW = undefined;

      const state = {
        metamask: {
          enabledNetworkMap: {
            eip155: {
              '0x1': true,
            },
          },
          selectedNetworkClientId: 'mainnetNetworkConfigurationId',
          networkConfigurationsByChainId: {
            [CHAIN_IDS.MAINNET]: {
              chainId: CHAIN_IDS.MAINNET,
              rpcEndpoints: [
                { networkClientId: 'mainnetNetworkConfigurationId' },
              ],
            },
          },
          multichainNetworkConfigurationsByChainId:
            AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS,
          selectedMultichainNetworkChainId: 'eip155:1',
          isEvmSelected: true,
        },
      };

      expect(selectors.getEnabledNetworks(state)).toStrictEqual({
        eip155: {
          [CHAIN_IDS.MAINNET]: true,
        },
      });
    });

    it('always returns an object containing the network if it is not included in popular networks', () => {
      const state = {
        metamask: {
          enabledNetworkMap: {
            eip155: {
              '0xNotPopularNetwork': true,
            },
          },
          selectedNetworkClientId: 'mainnetNetworkConfigurationId',
          networkConfigurationsByChainId: {
            '0xNotPopularNetwork': {
              chainId: '0xNotPopularNetwork',
              rpcEndpoints: [
                { networkClientId: 'mainnetNetworkConfigurationId' },
              ],
            },
          },
          multichainNetworkConfigurationsByChainId:
            AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS,
          selectedMultichainNetworkChainId: 'eip155:1',
          isEvmSelected: true,
        },
      };

      expect(selectors.getEnabledNetworks(state)).toStrictEqual({
        eip155: {
          '0xNotPopularNetwork': true,
        },
      });
    });

    it('returns an object containing all the popular networks for portfolio view', () => {
      const state = {
        metamask: {
          enabledNetworkMap: {
            eip155: {
              [CHAIN_IDS.MAINNET]: true,
              [CHAIN_IDS.LINEA_MAINNET]: true,
              [CHAIN_IDS.ARBITRUM]: true,
              [CHAIN_IDS.AVALANCHE]: true,
              [CHAIN_IDS.BSC]: true,
              [CHAIN_IDS.OPTIMISM]: true,
              [CHAIN_IDS.POLYGON]: true,
              [CHAIN_IDS.ZKSYNC_ERA]: true,
              [CHAIN_IDS.BASE]: true,
            },
          },
          selectedNetworkClientId: 'mainnetNetworkConfigurationId',
          networkConfigurationsByChainId: {
            [CHAIN_IDS.MAINNET]: {
              chainId: CHAIN_IDS.MAINNET,
              rpcEndpoints: [
                { networkClientId: 'mainnetNetworkConfigurationId' },
              ],
            },
          },
          preferences: {
            tokenNetworkFilter: {
              [CHAIN_IDS.MAINNET]: true,
              [CHAIN_IDS.LINEA_MAINNET]: true,
              [CHAIN_IDS.ARBITRUM]: true,
              [CHAIN_IDS.AVALANCHE]: true,
              [CHAIN_IDS.BSC]: true,
              [CHAIN_IDS.OPTIMISM]: true,
              [CHAIN_IDS.POLYGON]: true,
              [CHAIN_IDS.ZKSYNC_ERA]: true,
              [CHAIN_IDS.BASE]: true,
            },
          },
          multichainNetworkConfigurationsByChainId:
            AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS,
          selectedMultichainNetworkChainId: 'eip155:1',
          isEvmSelected: true,
        },
      };

      expect(selectors.getEnabledNetworks(state)).toStrictEqual({
        eip155: {
          [CHAIN_IDS.MAINNET]: true,
          [CHAIN_IDS.LINEA_MAINNET]: true,
          [CHAIN_IDS.ARBITRUM]: true,
          [CHAIN_IDS.AVALANCHE]: true,
          [CHAIN_IDS.BSC]: true,
          [CHAIN_IDS.OPTIMISM]: true,
          [CHAIN_IDS.POLYGON]: true,
          [CHAIN_IDS.ZKSYNC_ERA]: true,
          [CHAIN_IDS.BASE]: true,
        },
      });
    });

    it('always returns the same object (memoized) if the same state is given', () => {
      const state = {
        metamask: {
          enabledNetworkMap: {
            eip155: {
              [CHAIN_IDS.MAINNET]: true,
              [CHAIN_IDS.LINEA_MAINNET]: true,
              [CHAIN_IDS.ARBITRUM]: true,
              [CHAIN_IDS.AVALANCHE]: true,
              [CHAIN_IDS.BSC]: true,
              [CHAIN_IDS.OPTIMISM]: true,
              [CHAIN_IDS.POLYGON]: true,
              [CHAIN_IDS.ZKSYNC_ERA]: true,
              [CHAIN_IDS.BASE]: true,
            },
          },
          selectedNetworkClientId: 'mainnetNetworkConfigurationId',
          networkConfigurationsByChainId: {
            [CHAIN_IDS.MAINNET]: {
              chainId: CHAIN_IDS.MAINNET,
              rpcEndpoints: [
                { networkClientId: 'mainnetNetworkConfigurationId' },
              ],
            },
          },
          preferences: {
            tokenNetworkFilter: {
              [CHAIN_IDS.MAINNET]: true,
              [CHAIN_IDS.LINEA_MAINNET]: true,
              [CHAIN_IDS.ARBITRUM]: true,
              [CHAIN_IDS.AVALANCHE]: true,
              [CHAIN_IDS.BSC]: true,
              [CHAIN_IDS.OPTIMISM]: true,
              [CHAIN_IDS.POLYGON]: true,
              [CHAIN_IDS.ZKSYNC_ERA]: true,
              [CHAIN_IDS.BASE]: true,
            },
          },
          multichainNetworkConfigurationsByChainId:
            AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS,
          selectedMultichainNetworkChainId: 'eip155:1',
          isEvmSelected: true,
        },
      };

      const result1 = selectors.getTokenNetworkFilter(state);
      const result2 = selectors.getTokenNetworkFilter(state);
      expect(result1 === result2).toBe(true);
    });
  });

  describe('getMetaMaskAccounts', () => {
    it('return balance from cachedBalances if chainId passed is different from currentChainId', () => {
      const ACCOUNT_ADDRESS = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';
      const BALANCE = '38D7EA4C680000';
      const state = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          accountsByChainId: {
            ...mockState.metamask.accountsByChainId,
            '0x1': {
              [ACCOUNT_ADDRESS]: {
                balance: BALANCE,
              },
            },
          },
        },
      };
      expect(
        selectors.getMetaMaskAccounts(state, '0x1')[ACCOUNT_ADDRESS].balance,
      ).toStrictEqual(BALANCE);
    });
  });

  describe('getManageInstitutionalWallets', () => {
    it('returns the manageInstitutionalWallets state', () => {
      const state = {
        ...mockState,
        metamask: {
          ...mockState.metamask.metamask,
          manageInstitutionalWallets: true,
        },
      };

      expect(selectors.getManageInstitutionalWallets(state)).toBe(true);
    });
  });

  describe('#getHDEntropyIndex', () => {
    const selectedAddress = '0xSelectedAddress';
    const otherAddress = '0xOtherAddress';
    const hdKeyringType = KeyringType.hdKeyTree;
    const nonHdKeyringType = 'some-other-keyring-type';
    const entropySourceId1 = 'entropy-id-1';
    const entropySourceId2 = 'entropy-id-2';

    const baseMockState = {
      metamask: {
        internalAccounts: {
          accounts: {
            acc1: {
              address: selectedAddress,
              metadata: { keyring: { type: 'some-type' } },
              options: {},
            },
            acc2: {
              address: otherAddress,
              metadata: { keyring: { type: 'some-type' } },
              options: {},
            },
          },
          selectedAccount: 'acc1',
        },
        keyrings: [],
      },
    };

    it('should return the index of the HD keyring containing the selected address', () => {
      const state = {
        ...baseMockState,
        metamask: {
          ...baseMockState.metamask,
          keyrings: [
            {
              type: nonHdKeyringType,
              accounts: [otherAddress],
              metadata: {
                id: 'mock-keyring-id-1',
                name: '',
              },
            },
            {
              type: hdKeyringType,
              accounts: [otherAddress, selectedAddress],
              metadata: {
                id: 'mock-keyring-id-2',
                name: '',
              },
            }, // Index 1 (0 for hdKeyrings filter)
            {
              type: hdKeyringType,
              accounts: [otherAddress],
              metadata: {
                id: 'mock-keyring-id-3',
                name: '',
              },
            }, // Index 2 (1 for hdKeyrings filter)
          ],
        },
      };
      expect(selectors.getHDEntropyIndex(state)).toBe(0);
    });

    it('should return the index based on metadata if account not in HD keyring but entropySource matches', () => {
      const state = {
        ...baseMockState,
        metamask: {
          ...baseMockState.metamask,
          internalAccounts: {
            ...baseMockState.metamask.internalAccounts,
            accounts: {
              ...baseMockState.metamask.internalAccounts.accounts,
              acc1: {
                ...baseMockState.metamask.internalAccounts.accounts.acc1,
                options: { entropySource: entropySourceId2 },
              },
            },
          },
          keyrings: [
            {
              type: hdKeyringType,
              accounts: [otherAddress],
              metadata: {
                id: 'some-other-id',
                name: '',
              },
            }, // No selectedAddress here
            {
              type: nonHdKeyringType,
              accounts: [selectedAddress],
              metadata: {
                id: entropySourceId1,
                name: '',
              },
            },
            {
              type: nonHdKeyringType,
              accounts: [selectedAddress],
              metadata: {
                id: entropySourceId2,
                name: '',
              },
            },
          ],
        },
      };
      expect(selectors.getHDEntropyIndex(state)).toBe(2);
    });

    it('should return undefined if account not in HD keyring and entropySource does not match any metadata id', () => {
      const state = {
        ...baseMockState,
        metamask: {
          ...baseMockState.metamask,
          internalAccounts: {
            ...baseMockState.metamask.internalAccounts,
            accounts: {
              ...baseMockState.metamask.internalAccounts.accounts,
              acc1: {
                ...baseMockState.metamask.internalAccounts.accounts.acc1,
                options: { entropySource: 'non-matching-entropy-id' },
              },
            },
          },
          keyrings: [
            {
              type: hdKeyringType,
              accounts: [otherAddress],
              metadata: {
                id: entropySourceId1,
                name: '',
              },
            },
          ],
        },
      };
      expect(selectors.getHDEntropyIndex(state)).toBeUndefined();
    });

    it('should return undefined if account not in HD keyring and no entropySource in account options', () => {
      const state = {
        ...baseMockState,
        metamask: {
          ...baseMockState.metamask,
          // selected account acc1 has no options.entropySource by default in baseMockState
          keyrings: [
            {
              type: hdKeyringType,
              accounts: [otherAddress],
              metadata: {
                id: entropySourceId1,
                name: '',
              },
            },
          ],
        },
      };
      expect(selectors.getHDEntropyIndex(state)).toBeUndefined();
    });

    it('should return undefined if account not in HD keyring and no selected internal account found', () => {
      const state = {
        ...baseMockState,
        metamask: {
          ...baseMockState.metamask,
          internalAccounts: {
            ...baseMockState.metamask.internalAccounts,
            selectedAccount: 'non-existent-acc-id',
          },
          keyrings: [
            {
              type: hdKeyringType,
              accounts: [otherAddress],
              metadata: {
                id: entropySourceId1,
                name: '',
              },
            },
          ],
        },
      };
      expect(selectors.getHDEntropyIndex(state)).toBeUndefined();
    });

    it('should return undefined if no HD keyrings and no matching entropySource', () => {
      const state = {
        ...baseMockState,
        metamask: {
          ...baseMockState.metamask,
          internalAccounts: {
            ...baseMockState.metamask.internalAccounts,
            accounts: {
              ...baseMockState.metamask.internalAccounts.accounts,
              acc1: {
                ...baseMockState.metamask.internalAccounts.accounts.acc1,
                options: { entropySource: 'non-matching-entropy-id' },
              },
            },
          },
          keyrings: [
            {
              type: nonHdKeyringType,
              accounts: [selectedAddress],
              metadata: {
                id: entropySourceId1,
                name: '',
              },
            },
            {
              type: nonHdKeyringType,
              accounts: [otherAddress],
              metadata: { id: 'some-other-id', name: '' },
            },
          ],
        },
      };
      expect(selectors.getHDEntropyIndex(state)).toBeUndefined();
    });

    it('should return correct index from metadata if no HD keyrings but matching entropySource', () => {
      const state = {
        ...baseMockState,
        metamask: {
          ...baseMockState.metamask,
          internalAccounts: {
            ...baseMockState.metamask.internalAccounts,
            accounts: {
              ...baseMockState.metamask.internalAccounts.accounts,
              acc1: {
                ...baseMockState.metamask.internalAccounts.accounts.acc1,
                options: { entropySource: entropySourceId1 },
              },
            },
          },
          keyrings: [
            {
              type: nonHdKeyringType,
              accounts: [selectedAddress],
              metadata: {
                id: 'another-id',
                name: '',
              },
            },
            {
              type: nonHdKeyringType,
              accounts: [otherAddress],
              metadata: {
                id: entropySourceId1,
                name: '',
              },
            },
          ],
        },
      };
      expect(selectors.getHDEntropyIndex(state)).toBe(1);
    });

    it('should correctly identify the first HD keyring if multiple HD keyrings exist and selected address is in the first one', () => {
      const state = {
        ...baseMockState,
        metamask: {
          ...baseMockState.metamask,
          keyrings: [
            {
              type: hdKeyringType,
              accounts: [selectedAddress, otherAddress],
              metadata: {
                id: 'mock-keyring-id-1',
                name: '',
              },
            }, // Index 0 (0 for hdKeyrings filter)
            {
              type: hdKeyringType,
              accounts: [otherAddress],
              metadata: {
                id: 'mock-keyring-id-2',
                name: '',
              },
            }, // Index 1 (1 for hdKeyrings filter)
            {
              type: nonHdKeyringType,
              accounts: [otherAddress],
              metadata: {
                id: 'mock-keyring-id-3',
                name: '',
              },
            },
          ],
        },
      };
      expect(selectors.getHDEntropyIndex(state)).toBe(0);
    });

    it('should correctly identify a later HD keyring if selected address is not in earlier ones', () => {
      const state = {
        ...baseMockState,
        metamask: {
          ...baseMockState.metamask,
          keyrings: [
            {
              type: hdKeyringType,
              accounts: [otherAddress],
              metadata: {
                id: 'mock-keyring-id-1',
                name: '',
              },
            }, // Index 0 (0 for hdKeyrings filter)
            {
              type: nonHdKeyringType,
              accounts: [otherAddress],
              metadata: {
                id: 'mock-keyring-id-2',
                name: '',
              },
            },
            {
              type: hdKeyringType,
              accounts: [selectedAddress, otherAddress],
              metadata: {
                id: 'mock-keyring-id-3',
                name: '',
              },
            }, // Index 2 (1 for hdKeyrings filter)
          ],
        },
      };
      expect(selectors.getHDEntropyIndex(state)).toBe(1); // 1st HD keyring (index 1 of filtered hdKeyrings)
    });
  });
});

describe('getNativeTokenInfo', () => {
  const arrange = () => {
    const state = {
      metamask: {
        networkConfigurationsByChainId: {},
      },
    };

    return { state };
  };

  it('provides native token info from a network a user has added', () => {
    const mocks = arrange();
    mocks.state.metamask.networkConfigurationsByChainId['0x1337'] = {
      nativeCurrency: 'HELLO',
      name: 'MyToken',
    };

    const result = selectors.getNativeTokenInfo(
      mocks.state.metamask.networkConfigurationsByChainId,
      '0x1337',
    );
    expect(result).toStrictEqual({
      symbol: 'HELLO',
      decimals: 18,
      name: 'MyToken',
    });
  });

  it('provides native token info from a network added but with fallbacks for missing fields', () => {
    const mocks = arrange();
    mocks.state.metamask.networkConfigurationsByChainId['0x1337'] = {
      nativeCurrency: undefined,
      name: undefined,
    };

    const result = selectors.getNativeTokenInfo(
      mocks.state.metamask.networkConfigurationsByChainId,
      '0x1337',
    );
    expect(result).toStrictEqual({
      symbol: 'NATIVE',
      decimals: 18,
      name: 'Native Token',
    });
  });

  it('provides native token from known list of hardcoded native tokens', () => {
    const mocks = arrange();

    const result = selectors.getNativeTokenInfo(
      mocks.state.metamask.networkConfigurationsByChainId,
      '0x89',
    );
    expect(result).toStrictEqual({
      symbol: 'POL',
      decimals: 18,
      name: 'Polygon',
    });
  });

  it('fallbacks for unknown native token info', () => {
    const mocks = arrange();
    const result = selectors.getNativeTokenInfo(
      mocks.state.metamask.networkConfigurationsByChainId,
      '0xFakeToken',
    );
    expect(result).toStrictEqual({
      symbol: 'NATIVE',
      decimals: 18,
      name: 'Native Token',
    });
  });
});

describe('getInternalAccountsSortedByKeyring', () => {
  const hdAccountFromHdKeyring1 = {
    ...createMockInternalAccount({
      address: '0x67B2fAf7959fB61eb9746571041476Bbd0672569',
      keyringType: KeyringTypes.hd,
    }),
    balance: '0x0',
  };
  const hdAccountFromHdKeyring2 = {
    ...createMockInternalAccount({
      address: '0x38b00C1620c260cc683F0C89bda9b0D985A233a7',
      keyringType: KeyringTypes.hd,
    }),
    balance: '0x0',
  };
  const solanaAccount1 = {
    ...createMockInternalAccount({
      address: 'eVFCkMPMevHrWfkvAixLcjsJnpGTkuU4HAP3S3RXU3b',
      type: SolAccountType.DataAccount,
      keyringType: KeyringTypes.snap,
      snapOptions: {
        id: SOLANA_WALLET_SNAP_ID,
        name: SOLANA_WALLET_NAME,
        enabled: true,
      },
      options: {
        entropySource: 'mockHdKeyring1',
      },
    }),
    balance: '0',
  };
  const solanaAccount2 = {
    ...createMockInternalAccount({
      address: 'DdHGa63k3vcH6kqDbX834GpeRUUef81Q8bUrBPdF937k',
      type: SolAccountType.DataAccount,
      keyringType: KeyringTypes.snap,
      snapOptions: {
        id: SOLANA_WALLET_SNAP_ID,
        name: SOLANA_WALLET_NAME,
        enabled: true,
      },
      options: {
        entropySource: 'mockHdKeyring2',
      },
    }),
    balance: '0',
  };

  const mockHdKeyring1 = {
    type: KeyringTypes.hd,
    accounts: [hdAccountFromHdKeyring1.address],
    metadata: {
      id: 'mockHdKeyring1',
      name: '',
    },
  };

  const mockHdKeyring2 = {
    type: KeyringTypes.hd,
    accounts: [hdAccountFromHdKeyring2.address],
    metadata: {
      id: 'mockHdKeyring2',
      name: '',
    },
  };
  const mockSnapKeyring = {
    type: KeyringTypes.snap,
    accounts: [solanaAccount1.address, solanaAccount2.address],
    metadata: {
      id: 'mockSnapKeyring',
      name: '',
    },
  };

  it('returns internal accounts sorted by keyring', () => {
    const mockStateWithSnapAccounts = {
      metamask: {
        internalAccounts: {
          accounts: {
            [hdAccountFromHdKeyring1.id]: hdAccountFromHdKeyring1,
            [hdAccountFromHdKeyring2.id]: hdAccountFromHdKeyring2,
            [solanaAccount1.id]: solanaAccount1,
            [solanaAccount2.id]: solanaAccount2,
          },
          selectedAccount: solanaAccount1.id,
        },
        keyrings: [mockHdKeyring1, mockHdKeyring2, mockSnapKeyring],
        networkConfigurationsByChainId:
          mockState.metamask.networkConfigurationsByChainId,
        selectedNetworkClientId: mockState.metamask.selectedNetworkClientId,
      },
    };

    const result = selectors.getInternalAccountsSortedByKeyring(
      mockStateWithSnapAccounts,
    );
    expect(result).toStrictEqual([
      hdAccountFromHdKeyring1,
      solanaAccount1,
      hdAccountFromHdKeyring2,
      solanaAccount2,
    ]);
  });
});

describe('getUrlScanCacheResult', () => {
  it('returns undefined for empty hostname', () => {
    const result = selectors.getUrlScanCacheResult(mockState, '');
    expect(result).toBeUndefined();
  });

  it('returns undefined for invalid URL hostname', () => {
    const result = selectors.getUrlScanCacheResult(
      mockState,
      'not-a-valid-url',
    );
    expect(result).toBeUndefined();
  });

  it('returns the cached url scan result for a given hostname', () => {
    mockState.metamask.urlScanCache = {
      'example.com': {
        result: {
          domainName: 'example.com',
          recommendedAction: 'BLOCK',
        },
        timestamp: 1234567890,
      },
    };

    const result = selectors.getUrlScanCacheResult(mockState, 'example.com');
    expect(result).toStrictEqual({
      result: {
        domainName: 'example.com',
        recommendedAction: 'BLOCK',
      },
      timestamp: 1234567890,
    });
  });
});

describe('getGasFeesSponsoredNetworkEnabled', () => {
  it('returns the gasFeesSponsoredNetwork flag value for different scenarios', () => {
    const gasFeesSponsoredNetwork = {
      '0x1': true,
      '0x2': false,
    };
    const state = {
      ...mockState,
      metamask: {
        ...mockState.metamask,
        remoteFeatureFlags: {
          gasFeesSponsoredNetwork,
        },
      },
    };
    const result = selectors.getGasFeesSponsoredNetworkEnabled(state);
    expect(result).toStrictEqual(gasFeesSponsoredNetwork);
    expect(result['0x1']).toBe(true);
    expect(result['0x2']).toBe(false);
  });
});

describe('getHasAnyEvmNetworkEnabled', () => {
  it('returns true when at least one EVM network is enabled', () => {
    const state = {
      metamask: {
        enabledNetworkMap: {
          [KnownCaipNamespace.Eip155]: {
            '0x1': true,
            '0x5': false,
          },
        },
      },
    };
    expect(selectors.getHasAnyEvmNetworkEnabled(state)).toBe(true);
  });

  it('returns false when no EVM networks are enabled', () => {
    const state = {
      metamask: {
        enabledNetworkMap: {
          [KnownCaipNamespace.Eip155]: {
            '0x1': false,
            '0x5': false,
          },
        },
      },
    };
    expect(selectors.getHasAnyEvmNetworkEnabled(state)).toBe(false);
  });

  it('returns false when EVM namespace is empty', () => {
    const state = {
      metamask: {
        enabledNetworkMap: {
          [KnownCaipNamespace.Eip155]: {},
        },
      },
    };
    expect(selectors.getHasAnyEvmNetworkEnabled(state)).toBe(false);
  });

  it('returns false when EVM namespace is not present', () => {
    const state = {
      metamask: {
        enabledNetworkMap: {
          [KnownCaipNamespace.Solana]: {
            'solana:mainnet': true,
          },
        },
      },
    };
    expect(selectors.getHasAnyEvmNetworkEnabled(state)).toBe(false);
  });

  it('returns true when multiple EVM networks are enabled', () => {
    const state = {
      metamask: {
        enabledNetworkMap: {
          [KnownCaipNamespace.Eip155]: {
            '0x1': true,
            '0x89': true,
            '0xa': true,
          },
        },
      },
    };
    expect(selectors.getHasAnyEvmNetworkEnabled(state)).toBe(true);
  });

  it('returns true when mixed enabled/disabled EVM networks with at least one enabled', () => {
    const state = {
      metamask: {
        enabledNetworkMap: {
          [KnownCaipNamespace.Eip155]: {
            '0x1': false,
            '0x89': true,
            '0xa': false,
          },
          [KnownCaipNamespace.Solana]: {
            'solana:mainnet': true,
          },
        },
      },
    };
    expect(selectors.getHasAnyEvmNetworkEnabled(state)).toBe(true);
  });
});

describe('getShouldSubmitEventsForShieldEntryModal', () => {
  it('returns true if `shouldSubmitEvents` is true', () => {
    const state = {
      appState: {
        shieldEntryModal: {
          show: true,
          shouldSubmitEvents: true,
        },
      },
    };

    const result = selectors.getShouldSubmitEventsForShieldEntryModal(state);
    expect(result).toBe(true);
  });

  it('returns true if `metamask.showShieldEntryModalOnce` is null', () => {
    const state = {
      metamask: {
        showShieldEntryModalOnce: null,
      },
      appState: {
        shieldEntryModal: {
          show: true,
          hasUserInteractedWithModal: false,
          shouldSubmitEvents: true,
        },
      },
    };

    const result = selectors.getShouldSubmitEventsForShieldEntryModal(state);
    expect(result).toBe(true);
  });

  it('returns false if `metamask.showShieldEntryModalOnce` is false', () => {
    const state = {
      metamask: {
        showShieldEntryModalOnce: false,
      },
      appState: {
        shieldEntryModal: {
          show: true,
          hasUserInteractedWithModal: false,
        },
      },
    };

    const result = selectors.getShouldSubmitEventsForShieldEntryModal(state);
    expect(result).toBe(false);
  });

  it('returns false if `metamask.showShieldEntryModalOnce` is true', () => {
    const state = {
      metamask: {
        showShieldEntryModalOnce: true,
      },
      appState: {
        shieldEntryModal: {
          show: true,
          hasUserInteractedWithModal: false,
        },
      },
    };

    const result = selectors.getShouldSubmitEventsForShieldEntryModal(state);
    expect(result).toBe(false);
  });

  it('returns false if shouldSubmitEvents is false', () => {
    const state = {
      appState: {
        shieldEntryModal: {
          show: true,
          hasUserInteractedWithModal: false,
          shouldSubmitEvents: false,
        },
      },
    };

    const result = selectors.getShouldSubmitEventsForShieldEntryModal(state);
    expect(result).toBe(false);
  });
});
