import { deepClone } from '@metamask/snaps-utils';
import { ApprovalType } from '@metamask/controller-utils';
import { EthAccountType, EthMethod } from '@metamask/keyring-api';
import { TransactionStatus } from '@metamask/transaction-controller';
import mockState from '../../test/data/mock-state.json';
import { KeyringType } from '../../shared/constants/keyring';
import {
  CHAIN_IDS,
  LOCALHOST_DISPLAY_NAME,
  NETWORK_TYPES,
  OPTIMISM_DISPLAY_NAME,
} from '../../shared/constants/network';
import { SURVEY_DATE, SURVEY_GMT } from '../helpers/constants/survey';
import { PRIVACY_POLICY_DATE } from '../helpers/constants/privacy-policy';
import { createMockInternalAccount } from '../../test/jest/mocks';
import { ETH_EOA_METHODS } from '../../shared/constants/eth-methods';
import { mockNetworkState } from '../../test/stub/networks';
import * as selectors from './selectors';

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

const modifyStateWithHWKeyring = (keyring) => {
  const modifiedState = deepClone(mockState);
  modifiedState.metamask.internalAccounts.accounts[
    modifiedState.metamask.internalAccounts.selectedAccount
  ].metadata.keyring.type = keyring;

  return modifiedState;
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

  describe('#getSelectedInternalAccount', () => {
    it('returns undefined if selectedAccount is undefined', () => {
      expect(
        selectors.getSelectedInternalAccount({
          metamask: {
            internalAccounts: {
              accounts: {},
              selectedAccount: '',
            },
          },
        }),
      ).toBeUndefined();
    });

    it('returns selectedAccount', () => {
      const mockInternalAccount = {
        address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
        metadata: {
          name: 'Test Account',
          keyring: {
            type: 'HD Key Tree',
          },
        },
        options: {},
        methods: ETH_EOA_METHODS,
        type: EthAccountType.Eoa,
      };
      expect(
        selectors.getSelectedInternalAccount({
          metamask: {
            internalAccounts: {
              accounts: {
                [mockInternalAccount.id]: mockInternalAccount,
              },
              selectedAccount: mockInternalAccount.id,
            },
          },
        }),
      ).toStrictEqual(mockInternalAccount);
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

  describe('#getInternalAccounts', () => {
    it('returns a list of internal accounts', () => {
      expect(selectors.getInternalAccounts(mockState)).toStrictEqual(
        Object.values(mockState.metamask.internalAccounts.accounts),
      );
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

  describe('#getNeverShowSwitchedNetworkMessage', () => {
    it('returns the correct value', () => {
      expect(
        selectors.getNeverShowSwitchedNetworkMessage({
          metamask: { switchedNetworkNeverShowMessage: true },
        }),
      ).toStrictEqual(true);
    });
  });

  describe('#getSwitchedNetworkDetails', () => {
    it('returns no details when switchedNetworkDetails is empty', () => {
      expect(
        selectors.getSwitchedNetworkDetails({
          metamask: { switchedNetworkDetails: undefined },
        }),
      ).toStrictEqual(null);
    });

    it('returns network information when valid switchedNetworkDetails are present', () => {
      const origin = 'portfolio.metamask.io';

      expect(
        selectors.getSwitchedNetworkDetails({
          ...mockState,
          metamask: {
            ...mockState.metamask,
            switchedNetworkDetails: {
              networkClientId:
                mockState.metamask.networkConfigurations
                  .testNetworkConfigurationId.id,
              origin,
            },
          },
        }),
      ).toStrictEqual({
        imageUrl: './images/eth_logo.svg',
        nickname:
          mockState.metamask.networkConfigurations.testNetworkConfigurationId
            .nickname,
        origin,
      });
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

    it('returns correct number of unapproved transactions and queued requests', () => {
      expect(
        selectors.getNumberOfAllUnapprovedTransactionsAndMessages({
          metamask: {
            queuedRequestCount: 5,
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
      ).toStrictEqual(8);
    });

    it('returns correct number of unapproved transactions and messages', () => {
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
    const SELECTED_ORIGIN = 'https://portfolio.metamask.io';
    const SELECTED_ORIGIN_NETWORK_ID = NETWORK_TYPES.LINEA_SEPOLIA;
    const state = {
      activeTab: {
        origin: SELECTED_ORIGIN,
      },
      metamask: {
        isUnlocked: true,
        useRequestQueue: true,
        selectedTabOrigin: SELECTED_ORIGIN,
        unapprovedDecryptMsgs: [],
        unapprovedPersonalMsgs: [],
        unapprovedEncryptionPublicKeyMsgs: [],
        unapprovedTypedMessages: [],
        domains: {
          [SELECTED_ORIGIN]: SELECTED_ORIGIN_NETWORK_ID,
        },
        queuedRequestCount: 0,
        transactions: [],
        selectedNetworkClientId:
          mockState.metamask.networkConfigurations.testNetworkConfigurationId
            .id,
        networkConfigurations: mockState.metamask.networkConfigurations,
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
          selectedNetworkClientId: NETWORK_TYPES.LINEA_SEPOLIA,
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

    it('should return no network to switch to because there are queued requests', () => {
      const networkToSwitchTo = selectors.getNetworkToAutomaticallySwitchTo({
        ...state,
        metamask: {
          ...state.metamask,
          ...mockNetworkState({ chainId: CHAIN_IDS.SEPOLIA }),
          queuedRequestCount: 1,
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

  describe('#getNetworkConfigurations', () => {
    it('returns undefined if state.metamask.networkConfigurations is undefined', () => {
      expect(
        selectors.getNetworkConfigurations({
          metamask: {},
        }),
      ).toBeUndefined();
    });

    it('returns networkConfigurations', () => {
      const networkConfigurations = {
        testNetworkConfigurationId1: {
          rpcUrl: 'https://mock-rpc-url-1',
          chainId: '0xtest',
          ticker: 'TEST',
          id: 'testNetworkConfigurationId1',
        },
        testNetworkConfigurationId2: {
          rpcUrl: 'https://mock-rpc-url-2',
          chainId: '0x1337',
          ticker: 'RPC',
          id: 'testNetworkConfigurationId2',
        },
      };
      expect(
        selectors.getNetworkConfigurations({
          metamask: {
            networkConfigurations,
          },
        }),
      ).toStrictEqual(networkConfigurations);
    });
  });

  describe('#getNonTestNetworks', () => {
    it('returns nonTestNetworks', () => {
      const nonTestNetworks = selectors.getNonTestNetworks({
        metamask: {},
      });

      // Assert that the `nonTestNetworks` array returned by the selector matches a specific structure.
      expect(nonTestNetworks).toStrictEqual(
        expect.arrayContaining([
          expect.objectContaining({
            chainId: expect.any(String),
            nickname: expect.any(String),
            rpcUrl: expect.any(String),
            rpcPrefs: expect.objectContaining({
              imageUrl: expect.any(String),
            }),
            providerType: expect.any(String),
            ticker: expect.any(String),
            id: expect.any(String),
            removable: expect.any(Boolean),
          }),
        ]),
      );

      // Verify that each network object has a 'ticker' property that is not undefined
      nonTestNetworks.forEach((network) => {
        expect(network.ticker).toBeDefined();
      });
    });
  });
  describe('#getAllNetworks', () => {
    it('sorts Localhost to the bottom of the test lists', () => {
      const networks = selectors.getAllNetworks({
        metamask: {
          preferences: {
            showTestNetworks: true,
          },
          ...mockNetworkState({
            chainId: CHAIN_IDS.LOCALHOST,
            nickname: LOCALHOST_DISPLAY_NAME,
          }),
        },
      });
      const lastItem = networks.pop();
      expect(lastItem.nickname.toLowerCase()).toContain('localhost');
    });

    it('properly assigns a network as removable', () => {
      const networks = selectors.getAllNetworks({
        metamask: {
          preferences: {
            showTestNetworks: true,
          },
          ...mockNetworkState({
            chainId: CHAIN_IDS.LOCALHOST,
            nickname: LOCALHOST_DISPLAY_NAME,
            id: 'some-config-name',
          }),
        },
      });

      const mainnet = networks.find(
        (network) => network.id === NETWORK_TYPES.MAINNET,
      );
      expect(mainnet.removable).toBe(false);

      const customNetwork = networks.find(
        (network) => network.id === 'some-config-name',
      );
      expect(customNetwork.removable).toBe(true);
    });

    it('properly proposes a known network image when not provided by adding function', () => {
      const networks = selectors.getAllNetworks({
        metamask: {
          preferences: {
            showTestNetworks: true,
          },
          ...mockNetworkState({
            chainId: CHAIN_IDS.OPTIMISM,
            nickname: OPTIMISM_DISPLAY_NAME,
          }),
        },
      });

      const optimismConfig = networks.find(
        ({ chainId }) => chainId === CHAIN_IDS.OPTIMISM,
      );
      expect(optimismConfig.rpcPrefs.imageUrl).toBe('./images/optimism.svg');
    });
  });

  describe('#getCurrentNetwork', () => {
    it('returns built-in network configuration', () => {
      const modifiedMockState = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          selectedNetworkClientId: NETWORK_TYPES.SEPOLIA,
        },
      };
      const currentNetwork = selectors.getCurrentNetwork(modifiedMockState);

      expect(currentNetwork).toMatchInlineSnapshot(`
        {
          "chainId": "0xaa36a7",
          "id": "sepolia",
          "nickname": "Sepolia",
          "providerType": "sepolia",
          "removable": false,
          "rpcUrl": "https://sepolia.infura.io/v3/undefined",
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
          "removable": true,
          "rpcPrefs": {
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
          selectedNetworkClientId:
            mockState.metamask.networkConfigurations.testNetworkConfigurationId
              .id,
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
      expect(currentNetwork.nickname).toBe('Ethereum Mainnet');
    });
  });

  describe('#getAllEnabledNetworks', () => {
    it('returns only Mainnet and Linea with showTestNetworks off', () => {
      const networks = selectors.getAllEnabledNetworks({
        metamask: {
          preferences: {
            showTestNetworks: false,
          },
        },
      });
      expect(networks).toHaveLength(2);
    });

    it('returns networks with showTestNetworks on', () => {
      const networks = selectors.getAllEnabledNetworks({
        metamask: {
          preferences: {
            showTestNetworks: true,
          },
        },
      });
      expect(networks.length).toBeGreaterThan(2);
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

  it('returns selected internalAccount', () => {
    expect(selectors.getSelectedInternalAccount(mockState)).toStrictEqual({
      address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
      id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
      metadata: {
        name: 'Test Account',
        keyring: {
          type: 'HD Key Tree',
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
          keyrings: [
            {
              type: KeyringType.ledger,
              accounts: ['0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'],
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

  it('#getGasIsLoading', () => {
    const gasIsLoading = selectors.getGasIsLoading(mockState);
    expect(gasIsLoading).toStrictEqual(false);
  });

  it('#getCurrentCurrency', () => {
    const currentCurrency = selectors.getCurrentCurrency(mockState);
    expect(currentCurrency).toStrictEqual('usd');
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
  it('#getNotifications', () => {
    const notifications = selectors.getNotifications(mockState);

    expect(notifications).toStrictEqual([
      mockState.metamask.notifications.test,
      mockState.metamask.notifications.test2,
    ]);
  });
  it('#getReadNotificationsCount', () => {
    const readNotificationsCount =
      selectors.getReadNotificationsCount(mockState);
    expect(readNotificationsCount).toStrictEqual(1);
  });
  it('#getUnreadNotificationsCount', () => {
    const unreadNotificationCount =
      selectors.getUnreadNotificationsCount(mockState);

    expect(unreadNotificationCount).toStrictEqual(1);
  });

  it('#getUnreadNotifications', () => {
    const unreadNotifications = selectors.getUnreadNotifications(mockState);

    expect(unreadNotifications).toStrictEqual([
      mockState.metamask.notifications.test,
    ]);
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

  it('#getTotalUnapprovedSignatureRequestCount', () => {
    const totalUnapprovedSignatureRequestCount =
      selectors.getTotalUnapprovedSignatureRequestCount(mockState);
    expect(totalUnapprovedSignatureRequestCount).toStrictEqual(0);
  });

  describe('#getPetnamesEnabled', () => {
    function createMockStateWithPetnamesEnabled(petnamesEnabled) {
      return { metamask: { preferences: { petnamesEnabled } } };
    }

    describe('usePetnamesEnabled', () => {
      const tests = [
        {
          petnamesEnabled: true,
          expectedResult: true,
        },
        {
          petnamesEnabled: false,
          expectedResult: false,
        },
        {
          // Petnames is enabled by default.
          petnamesEnabled: undefined,
          expectedResult: true,
        },
      ];

      tests.forEach(({ petnamesEnabled, expectedResult }) => {
        it(`should return ${String(
          expectedResult,
        )} when petnames preference is ${String(petnamesEnabled)}`, () => {
          const result = selectors.getPetnamesEnabled(
            createMockStateWithPetnamesEnabled(petnamesEnabled),
          );
          expect(result).toBe(expectedResult);
        });
      });
    });
  });

  it('#getIsBridgeChain', () => {
    const isOptimismSupported = selectors.getIsBridgeChain({
      metamask: {
        ...mockNetworkState({ chainId: CHAIN_IDS.OPTIMISM }),
      },
    });
    expect(isOptimismSupported).toBeTruthy();

    const isFantomSupported = selectors.getIsBridgeChain({
      metamask: {
        ...mockNetworkState({ chainId: CHAIN_IDS.FANTOM }),
      },
    });
    expect(isFantomSupported).toBeFalsy();
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

  it('#getInfuraBlocked', () => {
    let isInfuraBlocked = selectors.getInfuraBlocked(mockState);
    expect(isInfuraBlocked).toBe(false);

    const modifiedMockState = {
      ...mockState,
      metamask: {
        ...mockState.metamask,
        ...mockNetworkState({
          chainId: CHAIN_IDS.GOERLI,
          metadata: { status: 'blocked' },
        }),
      },
    };
    isInfuraBlocked = selectors.getInfuraBlocked(modifiedMockState);
    expect(isInfuraBlocked).toBe(true);
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

  describe('#getShowSurveyToast', () => {
    const realDateNow = Date.now;

    afterEach(() => {
      Date.now = realDateNow;
    });

    it('shows the survey link when not yet seen and within time bounds', () => {
      Date.now = () =>
        new Date(`${SURVEY_DATE} 12:25:00 ${SURVEY_GMT}`).getTime();
      const result = selectors.getShowSurveyToast({
        metamask: {
          surveyLinkLastClickedOrClosed: null,
        },
      });
      expect(result).toStrictEqual(true);
    });

    it('does not show the survey link when seen and within time bounds', () => {
      Date.now = () =>
        new Date(`${SURVEY_DATE} 12:25:00 ${SURVEY_GMT}`).getTime();
      const result = selectors.getShowSurveyToast({
        metamask: {
          surveyLinkLastClickedOrClosed: 123456789,
        },
      });
      expect(result).toStrictEqual(false);
    });

    it('does not show the survey link before time bounds', () => {
      Date.now = () =>
        new Date(`${SURVEY_DATE} 11:25:00 ${SURVEY_GMT}`).getTime();
      const result = selectors.getShowSurveyToast({
        metamask: {
          surveyLinkLastClickedOrClosed: null,
        },
      });
      expect(result).toStrictEqual(false);
    });

    it('does not show the survey link after time bounds', () => {
      Date.now = () =>
        new Date(`${SURVEY_DATE} 14:25:00 ${SURVEY_GMT}`).getTime();
      const result = selectors.getShowSurveyToast({
        metamask: {
          surveyLinkLastClickedOrClosed: null,
        },
      });
      expect(result).toStrictEqual(false);
    });
  });

  describe('#getShowPrivacyPolicyToast', () => {
    let dateNowSpy;

    describe('mock one day after', () => {
      beforeEach(() => {
        const dayAfterPolicyDate = new Date(PRIVACY_POLICY_DATE);
        dayAfterPolicyDate.setDate(dayAfterPolicyDate.getDate() + 1);

        dateNowSpy = jest
          .spyOn(Date, 'now')
          .mockReturnValue(dayAfterPolicyDate.getTime());
      });

      afterEach(() => {
        dateNowSpy.mockRestore();
      });

      it('shows the privacy policy toast when not yet seen, on or after the policy date, and onboardingDate is before the policy date', () => {
        const result = selectors.getShowPrivacyPolicyToast({
          metamask: {
            newPrivacyPolicyToastClickedOrClosed: null,
            onboardingDate: new Date(PRIVACY_POLICY_DATE).setDate(
              new Date(PRIVACY_POLICY_DATE).getDate() - 2,
            ),
          },
        });
        expect(result).toBe(true);
      });

      it('does not show the privacy policy toast when seen, even if on or after the policy date and onboardingDate is before the policy date', () => {
        const result = selectors.getShowPrivacyPolicyToast({
          metamask: {
            newPrivacyPolicyToastClickedOrClosed: true,
            onboardingDate: new Date(PRIVACY_POLICY_DATE).setDate(
              new Date(PRIVACY_POLICY_DATE).getDate() - 2,
            ),
          },
        });
        expect(result).toBe(false);
      });

      it('shows the privacy policy toast when not yet seen, on or after the policy date, and onboardingDate is not set', () => {
        const result = selectors.getShowPrivacyPolicyToast({
          metamask: {
            newPrivacyPolicyToastClickedOrClosed: null,
            onboardingDate: null,
          },
        });
        expect(result).toBe(true);
      });
    });

    describe('mock same day', () => {
      beforeEach(() => {
        dateNowSpy = jest
          .spyOn(Date, 'now')
          .mockReturnValue(new Date(PRIVACY_POLICY_DATE).getTime());
      });

      afterEach(() => {
        dateNowSpy.mockRestore();
      });

      it('shows the privacy policy toast when not yet seen, on or after the policy date, and onboardingDate is before the policy date', () => {
        const result = selectors.getShowPrivacyPolicyToast({
          metamask: {
            newPrivacyPolicyToastClickedOrClosed: null,
            onboardingDate: new Date(PRIVACY_POLICY_DATE).setDate(
              new Date(PRIVACY_POLICY_DATE).getDate() - 2,
            ),
          },
        });
        expect(result).toBe(true);
      });

      it('does not show the privacy policy toast when seen, even if on or after the policy date and onboardingDate is before the policy date', () => {
        const result = selectors.getShowPrivacyPolicyToast({
          metamask: {
            newPrivacyPolicyToastClickedOrClosed: true,
            onboardingDate: new Date(PRIVACY_POLICY_DATE).setDate(
              new Date(PRIVACY_POLICY_DATE).getDate() - 2,
            ),
          },
        });
        expect(result).toBe(false);
      });

      it('shows the privacy policy toast when not yet seen, on or after the policy date, and onboardingDate is not set', () => {
        const result = selectors.getShowPrivacyPolicyToast({
          metamask: {
            newPrivacyPolicyToastClickedOrClosed: null,
            onboardingDate: null,
          },
        });
        expect(result).toBe(true);
      });
    });

    describe('mock day before', () => {
      beforeEach(() => {
        const dayBeforePolicyDate = new Date(PRIVACY_POLICY_DATE);
        dayBeforePolicyDate.setDate(dayBeforePolicyDate.getDate() - 1);

        dateNowSpy = jest
          .spyOn(Date, 'now')
          .mockReturnValue(dayBeforePolicyDate.getTime());
      });

      afterEach(() => {
        dateNowSpy.mockRestore();
      });

      it('does not show the privacy policy toast before the policy date', () => {
        const result = selectors.getShowPrivacyPolicyToast({
          metamask: {
            newPrivacyPolicyToastClickedOrClosed: null,
            onboardingDate: new Date(PRIVACY_POLICY_DATE).setDate(
              new Date(PRIVACY_POLICY_DATE).getDate() - 2,
            ),
          },
        });
        expect(result).toBe(false);
      });

      it('does not show the privacy policy toast before the policy date even if onboardingDate is not set', () => {
        const result = selectors.getShowPrivacyPolicyToast({
          metamask: {
            newPrivacyPolicyToastClickedOrClosed: null,
            onboardingDate: null,
          },
        });
        expect(result).toBe(false);
      });
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
              eth_accounts: {
                caveats: [
                  {
                    type: 'restrictReturnedAccounts',
                    value: ['0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'],
                  },
                ],
                invoker: 'https://test.dapp',
                parentCapability: 'eth_accounts',
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
          name: 'Test Account 2',
          keyring: {
            type: 'HD Key Tree',
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
        pinned: true,
        hidden: false,
        active: false,
      },

      {
        address: '0xeb9e64b93097bc15f01f13eae97015c57ab64823',
        balance: '0x0',
        id: '784225f4-d30b-4e77-a900-c8bbce735b88',
        metadata: {
          name: 'Test Account 3',
          keyring: {
            type: 'HD Key Tree',
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
        pinned: true,
        hidden: false,
        active: false,
      },

      {
        address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
        metadata: {
          name: 'Test Account',
          keyring: {
            type: 'HD Key Tree',
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
          name: 'Snap Account 1',
          snap: {
            id: 'snap-id',
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
      },
      {
        id: '694225f4-d30b-4e77-a900-c8bbce735b42',
        metadata: {
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
        rpcPrefs: {
          imageUrl: 'network1-icon.png',
        },
        nickname: 'Network 1',
      },
      {
        id: 'network2',
        rpcPrefs: {
          imageUrl: 'network2-icon.png',
        },
        nickname: 'Network 2',
      },
    ];

    const expectedSitesList = {
      site1: {
        id: 'site1',
        networkIconUrl: 'network1-icon.png',
        networkName: 'Network 1',
      },
      site2: {
        id: 'site2',
        networkIconUrl: 'network2-icon.png',
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
});
