import { toChecksumAddress } from 'ethereumjs-util';
import { CustodyAccountDetails } from '@metamask-institutional/custody-controller';
import { EthAccountType } from '@metamask/keyring-api';
import { Hex } from '@metamask/utils';
import { toHex } from '@metamask/controller-utils';
import { InternalAccountWithBalance } from '../selectors.types';
import { MetaMaskReduxState } from '../../store/store';
import { ETH_EOA_METHODS } from '../../../shared/constants/eth-methods';
import { mockNetworkState } from '../../../test/stub/networks';
import {
  CustodyControllerState,
  MmiConfigurationControllerState,
} from '../../../shared/types/institutional';
import {
  CHAIN_IDS,
  CURRENCY_SYMBOLS,
  NETWORK_TO_NAME_MAP,
} from '../../../shared/constants/network';
import {
  getConfiguredCustodians,
  getCustodianIconForAddress,
  getCustodyAccountDetails,
  getCustodyAccountSupportedChains,
  getMmiPortfolioEnabled,
  getMmiPortfolioUrl,
  getTransactionStatusMap,
  getWaitForConfirmDeepLinkDialog,
  getIsCustodianSupportedChain,
  getMMIAddressFromModalOrAddress,
  getMMIConfiguration,
  getInteractiveReplacementToken,
  getCustodianDeepLink,
  getNoteToTraderMessage,
  getIsNoteToTraderSupported,
} from './selectors';
import { BackgroundStateProxy } from '../../../shared/types/metamask';

const custodianMock = {
  type: 'saturn',
  envName: 'custodian1',
  apiUrl: 'https://saturn-custody.dev.metamask-institutional.io',
  iconUrl: 'images/saturn.svg',
  displayName: 'Saturn Custody',
  production: true,
  refreshTokenUrl: 'test',
  isNoteToTraderSupported: true,
  version: 1,
  name: 'Saturn',
  onboardingUrl:
    'https://onboarding.saturn-custody.dev.metamask-institutional.io',
  website: 'https://saturn-custody.dev.metamask-institutional.io',
  apiVersion: 'v1',
  websocketApiUrl: 'wss://saturn-custody.dev.metamask-institutional.io',
  isQRCodeSupported: true,
  custodianPublishesTransaction: true,
};

function buildState(overrides = {}) {
  const defaultState = {
    metamask: {
      NetworkController: {
        selectedNetworkClientId: '0x1',
        networkConfigurationsByChainId: {
          [CHAIN_IDS.MAINNET]: {
            chainId: CHAIN_IDS.MAINNET,
            blockExplorerUrls: [],
            defaultRpcEndpointIndex: 0,
            name: NETWORK_TO_NAME_MAP[CHAIN_IDS.MAINNET],
            nativeCurrency: CURRENCY_SYMBOLS.ETH,
            rpcEndpoints: [],
          },
        },
      },
      AccountsController: {
        internalAccounts: {
          selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
          accounts: {
            'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
              id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
              metadata: {
                name: 'Custody Account A',
                keyring: {
                  type: 'Custody',
                },
                importTime: 0,
              },
              options: {},
              methods: ETH_EOA_METHODS,

              type: EthAccountType.Eoa,
              code: '0x',
              balance: '0x47c9d71831c76efe',
              nonce: '0x1b',
              address: '0x5Ab19e7091dD208F352F8E727B6DCC6F8aBB6275',
            },
          },
        },
      },
      KeyringController: {
        keyrings: [
          {
            type: 'Custody',
            accounts: ['0x5Ab19e7091dD208F352F8E727B6DCC6F8aBB6275'],
          },
        ],
      },
      CustodyController: {
        waitForConfirmDeepLinkDialog: '123',
        custodyStatusMaps: { '123': {} },
        custodyAccountDetails: {
          '0x5Ab19e7091dD208F352F8E727B6DCC6F8aBB6275': {
            custodianName: 'saturn',
          } as CustodyAccountDetails,
        },
        custodianSupportedChains: {
          '0x5Ab19e7091dD208F352F8E727B6DCC6F8aBB6275': {
            supportedChains: ['1', '2'],
            custodianName: 'saturn',
          },
        },
        apiRequestLogs: [],
        custodianConnectRequest: {},
      },
      MmiConfigurationController: {
        mmiConfiguration: {
          portfolio: {
            enabled: true,
            url: 'https://dashboard.metamask-institutional.io',
          },
          custodians: [custodianMock],
        } as MmiConfigurationControllerState['mmiConfiguration'],
      },
    },
  };
  return { ...defaultState, ...overrides };
}

describe('Institutional selectors', () => {
  describe('getWaitForConfirmDeepLinkDialog', () => {
    it('extracts a state property', () => {
      const state = buildState();
      const result = getWaitForConfirmDeepLinkDialog(state);
      expect(result).toStrictEqual(
        state.metamask.CustodyController.waitForConfirmDeepLinkDialog,
      );
    });
  });

  describe('getCustodyAccountDetails', () => {
    it('extracts a state property', () => {
      const state = buildState();
      const result = getCustodyAccountDetails(state);
      expect(result).toStrictEqual(
        state.metamask.CustodyController.custodyAccountDetails,
      );
    });
  });

  describe('getTransactionStatusMap', () => {
    it('extracts a state property', () => {
      const state = buildState();
      const result = getTransactionStatusMap(state);
      expect(result).toStrictEqual(
        state.metamask.CustodyController.custodyStatusMaps,
      );
    });
  });

  describe('getCustodyAccountSupportedChains', () => {
    it('extracts a state property', () => {
      const state = buildState();
      const result = getCustodyAccountSupportedChains(
        state,
        '0x5ab19e7091dd208f352f8e727b6dcc6f8abb6275',
      );
      expect(result).toStrictEqual(
        (
          state.metamask.CustodyController.custodianSupportedChains as Record<
            string,
            { supportedChains: string[]; custodianName: string }
          >
        )[toChecksumAddress('0x5ab19e7091dd208f352f8e727b6dcc6f8abb6275')],
      );
    });
  });

  describe('getMmiPortfolioEnabled', () => {
    it('extracts a state property', () => {
      const state = buildState();
      const result = getMmiPortfolioEnabled(state);
      expect(result).toStrictEqual(
        state.metamask.MmiConfigurationController.mmiConfiguration.portfolio
          .enabled,
      );
    });
  });

  describe('getMmiPortfolioUrl', () => {
    it('extracts a state property', () => {
      const state = buildState();
      const result = getMmiPortfolioUrl(state);
      expect(result).toStrictEqual(
        state.metamask.MmiConfigurationController.mmiConfiguration.portfolio
          .url,
      );
    });
  });

  describe('getConfiguredCustodians', () => {
    it('extracts a state property', () => {
      const state = buildState();
      const result = getConfiguredCustodians(state);
      expect(result).toStrictEqual(
        state.metamask.MmiConfigurationController.mmiConfiguration.custodians,
      );
    });
  });

  describe('getCustodianIconForAddress', () => {
    it('extracts a state property', () => {
      const newState = {
        metamask: {
          CustodyController: {
            custodyAccountDetails: {
              '0x5Ab19e7091dD208F352F8E727B6DCC6F8aBB6275': {
                custodianName: 'custodian1',
              },
            },
          },
          MmiConfigurationController: {
            mmiConfiguration: {
              custodians: [custodianMock],
            },
          },
        },
      };

      const state = buildState(newState);
      const result = getCustodianIconForAddress(
        state,
        '0x5Ab19e7091dD208F352F8E727B6DCC6F8aBB6275',
      );

      expect(result).toStrictEqual(
        state.metamask.MmiConfigurationController.mmiConfiguration.custodians[0]
          .iconUrl,
      );
    });
  });

  describe('getIsCustodianSupportedChain', () => {
    it('returns true if the current keyring type is "custody" and currently selected chain ID is in the list of supported chain IDs', () => {
      const accountAddress = '0x1';
      const state = buildState({
        metamask: {
          AccountsController: {
            internalAccounts: {
              selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
              accounts: {
                'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
                  id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
                  metadata: {
                    name: 'Custody Account A',
                    keyring: {
                      type: 'Custody',
                    },
                    importTime: 0,
                  },
                  options: {},
                  methods: ETH_EOA_METHODS,
                  type: EthAccountType.Eoa,
                  code: '0x',
                  balance: '0x47c9d71831c76efe',
                  nonce: '0x1b',
                  address: accountAddress,
                },
              },
            },
          },
          CustodyController: {
            custodianSupportedChains: {
              [accountAddress]: {
                supportedChains: ['1', '2', '3'],
              },
            },
          },
          ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
        },
      });

      const isSupported = getIsCustodianSupportedChain(state);

      expect(isSupported).toBe(true);
    });

    it('returns false if the current keyring type is "custody" and the currently selected chain ID is not in the list of supported chain IDs', () => {
      const accountAddress = '0x1';
      const state = buildState({
        metamask: {
          internalAccounts: {
            selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
            accounts: {
              'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
                id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
                metadata: {
                  name: 'Custody Account A',
                  keyring: {
                    type: 'Custody',
                  },
                },
                options: {},
                methods: ETH_EOA_METHODS,
                type: EthAccountType.Eoa,
                code: '0x',
                balance: '0x47c9d71831c76efe',
                nonce: '0x1b',
                address: accountAddress,
              },
            },
          },
          custodianSupportedChains: {
            [accountAddress]: {
              supportedChains: ['4'],
            },
          },
          ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
        },
      });

      const isSupported = getIsCustodianSupportedChain(state);

      expect(isSupported).toBe(false);
    });

    it('returns true if the current keyring type is not "custody"', () => {
      const accountAddress = '0x1';
      const state = buildState({
        metamask: {
          keyrings: [
            {
              type: 'SomethingElse',
              accounts: [accountAddress],
            },
          ],
          custodianSupportedChains: {
            [accountAddress]: {
              supportedChains: ['4'],
            },
          },
          internalAccounts: {
            accounts: {
              'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
                address: accountAddress,
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
              },
            },
            selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
          },
          ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
        },
      });

      const isSupported = getIsCustodianSupportedChain(state);

      expect(isSupported).toBe(true);
    });

    it('throws an error if accountType is null', () => {
      const accountAddress = '0x1';
      const state = buildState({
        metamask: {
          ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
          internalAccounts: {
            selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
            accounts: {
              'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
                id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
                metadata: {
                  name: 'Custody Account A',
                },
                options: {},
                methods: ETH_EOA_METHODS,
                type: EthAccountType.Eoa,
                code: '0x',
                balance: '0x47c9d71831c76efe',
                nonce: '0x1b',
                address: accountAddress,
              },
            },
          },
          keyrings: [],
          custodianSupportedChains: {},
          networkConfigurationsByChainId: {
            [toHex(1)]: {
              chainId: toHex(1),
              rpcEndpoints: [{}],
            },
          },
        },
      });

      expect(() => getIsCustodianSupportedChain(state)).toThrow(
        'Invalid state',
      );
    });

    it('returns true if supportedChains is null', () => {
      const accountAddress = '0x1';
      const state = buildState({
        metamask: {
          internalAccounts: {
            selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
            accounts: {
              'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
                id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
                metadata: {
                  name: 'Custody Account A',
                  keyring: {
                    type: 'Custody',
                  },
                },
                options: {},
                methods: ETH_EOA_METHODS,
                type: EthAccountType.Eoa,
                code: '0x',
                balance: '0x47c9d71831c76efe',
                nonce: '0x1b',
                address: accountAddress,
              },
            },
          },
          keyrings: [
            {
              type: 'Custody',
              accounts: [accountAddress],
            },
          ],
          custodianSupportedChains: {
            [accountAddress]: null,
          },
          ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
        },
      });

      const isSupported = getIsCustodianSupportedChain(state);

      expect(isSupported).toBe(true);
    });

    it('returns false if the supportedChains array is empty', () => {
      const accountAddress = '0x1';
      const state = buildState({
        metamask: {
          internalAccounts: {
            selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
            accounts: {
              'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
                id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
                metadata: {
                  name: 'Custody Account A',
                  keyring: {
                    type: 'Custody',
                  },
                },
                options: {},
                methods: ETH_EOA_METHODS,
                type: EthAccountType.Eoa,
                code: '0x',
                balance: '0x47c9d71831c76efe',
                nonce: '0x1b',
                address: accountAddress,
              },
            },
          },
          keyrings: [
            {
              type: 'Custody',
              accounts: [accountAddress],
            },
          ],
          custodianSupportedChains: {
            [accountAddress]: {
              supportedChains: [],
            },
          },
          ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
        },
      });

      const isSupported = getIsCustodianSupportedChain(state);

      expect(isSupported).toBe(false);
    });

    it('throws an error if chain ID is not a string', () => {
      const accountAddress = '0x1';
      const state = buildState({
        metamask: {
          internalAccounts: {
            selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
            accounts: {
              'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
                id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
                metadata: {
                  name: 'Custody Account A',
                  keyring: {
                    type: 'Custody',
                  },
                },
                options: {},
                methods: ETH_EOA_METHODS,
                type: EthAccountType.Eoa,
                code: '0x',
                balance: '0x47c9d71831c76efe',
                nonce: '0x1b',
                address: accountAddress,
              },
            },
          },
          keyrings: [
            {
              type: 'Custody',
              accounts: [accountAddress],
            },
          ],
          custodianSupportedChains: {
            [accountAddress]: {
              supportedChains: ['1'],
            },
          },
          ...mockNetworkState({ chainId: 1 as unknown as Hex }),
        },
      });

      expect(() => getIsCustodianSupportedChain(state)).toThrow(
        'Chain ID must be a string',
      );
    });

    it('throws an error if chain ID is not a hexadecimal number', () => {
      const accountAddress = '0x1';
      const state = buildState({
        metamask: {
          internalAccounts: {
            selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
            accounts: {
              'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
                id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
                metadata: {
                  name: 'Custody Account A',
                  keyring: {
                    type: 'Custody',
                  },
                },
                options: {},
                methods: ETH_EOA_METHODS,
                type: EthAccountType.Eoa,
                code: '0x',
                balance: '0x47c9d71831c76efe',
                nonce: '0x1b',
                address: '0x5Ab19e7091dD208F352F8E727B6DCC6F8aBB6275',
              },
            },
          },
          keyrings: [
            {
              type: 'Custody',
              accounts: [accountAddress],
            },
          ],
          custodianSupportedChains: {
            [accountAddress]: {
              supportedChains: ['1'],
            },
          },
          ...mockNetworkState({ chainId: 'not a hex number' as Hex }),
        },
      });

      expect(() => getIsCustodianSupportedChain(state)).toThrow(
        'Chain ID must be a hexadecimal number',
      );
    });
  });

  describe('getMMIAddressFromModalOrAddress', () => {
    it('returns modalAddress if it exists', () => {
      const state = {
        appState: {
          modal: {
            modalState: {
              props: {
                address: 'modalAddress',
              },
            },
          },
        } as unknown as MetaMaskReduxState['appState'],
        metamask: {
          AccountsController: {
            internalAccounts: {
              accounts: {},
              selectedAccount: '',
            },
          },
          MmiConfigurationController: {} as MmiConfigurationControllerState,
        },
      };

      const address = getMMIAddressFromModalOrAddress(state);

      expect(address).toBe('modalAddress');
    });

    it('returns selectedAccount if modalAddress does not exist', () => {
      const mockInternalAccount: InternalAccountWithBalance & {
        code: Hex;
        nonce: Hex;
      } = {
        id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
        address: '0x5Ab19e7091dD208F352F8E727B6DCC6F8aBB6275',
        metadata: {
          name: 'Custody Account A',
          importTime: Date.now(),
          keyring: {
            type: 'Custody',
          },
          snap: undefined,
        },
        options: {},
        methods: ['EthMethod1'],
        type: EthAccountType.Eoa,
        code: '0x',
        balance: '0x47c9d71831c76efe',
        nonce: '0x1b',
      };

      const state = {
        appState: {
          modal: {
            modalState: {
              props: {},
            },
          },
        } as unknown as MetaMaskReduxState['appState'],
        metamask: {
          AccountsController: {
            internalAccounts: {
              accounts: {
                [mockInternalAccount.id]: mockInternalAccount,
              },
              selectedAccount: mockInternalAccount.id,
            },
          },
          MmiConfigurationController: {} as MmiConfigurationControllerState,
        },
      };

      const address = getMMIAddressFromModalOrAddress(state);

      expect(address).toBe(mockInternalAccount.address);
    });

    it('returns undefined if neither modalAddress nor selectedAccount exist', () => {
      const state = {
        appState: {
          modal: {
            modalState: {
              props: {},
            },
          },
        } as unknown as MetaMaskReduxState['appState'],
        metamask: {
          AccountsController: {
            internalAccounts: {
              accounts: {},
              selectedAccount: '',
            },
          },
          MmiConfigurationController: {} as MmiConfigurationControllerState,
        },
      };

      const address = getMMIAddressFromModalOrAddress(state);

      expect(address).toBeUndefined();
    });
  });

  describe('getMMIConfiguration', () => {
    it('returns mmiConfiguration if it exists', () => {
      const mmiConfiguration = {
        portfolio: {
          enabled: true,
          url: 'https://example.com',
        },
        custodians: [custodianMock],
      } as MmiConfigurationControllerState['mmiConfiguration'];

      const state = {
        metamask: {
          MmiConfigurationController: { mmiConfiguration },
        },
      };

      const config = getMMIConfiguration(state);

      expect(config).toStrictEqual(mmiConfiguration);
    });

    it('returns an empty object if mmiConfiguration does not exist', () => {
      const state = {
        metamask: { MmiConfigurationController: {} },
      };

      // @ts-expect-error Intentionally passing incomplete input for testing
      const config = getMMIConfiguration(state);

      expect(config).toStrictEqual({});
    });
  });

  describe('getInteractiveReplacementToken', () => {
    it('returns interactiveReplacementToken if it exists', () => {
      const interactiveReplacementToken = {
        url: 'testUrl',
        oldRefreshToken: 'testToken',
      };
      const state = {
        metamask: {
          AppStateController: {
            interactiveReplacementToken,
          },
        } as Pick<BackgroundStateProxy, 'AppStateController'>,
      };

      const token = getInteractiveReplacementToken(state);

      expect(token).toStrictEqual(interactiveReplacementToken);
    });

    it('returns an empty object if interactiveReplacementToken does not exist', () => {
      const state = {
        metamask: { AppStateController: {} },
      };

      // @ts-expect-error Intentionally passing incomplete input for testing
      const token = getInteractiveReplacementToken(state);

      expect(token).toStrictEqual({});
    });
  });

  describe('getCustodianDeepLink', () => {
    it('returns custodianDeepLink if it exists', () => {
      const custodianDeepLink = {
        fromAddress: '0x',
        custodyId: 'custodyId',
      };
      const state = {
        metamask: {
          AppStateController: {
            custodianDeepLink,
          },
        } as Pick<BackgroundStateProxy, 'AppStateController'>,
      };

      const token = getCustodianDeepLink(state);

      expect(token).toStrictEqual(custodianDeepLink);
    });

    it('returns an empty object if custodianDeepLink does not exist', () => {
      const state = {
        metamask: { AppStateController: {} },
      };

      // @ts-expect-error Intentionally passing incomplete input for testing
      const token = getCustodianDeepLink(state);

      expect(token).toStrictEqual({});
    });
  });

  describe('getIsNoteToTraderSupported', () => {
    it('returns true if isNoteToTraderSupported is true for the custodian', () => {
      const state = {
        metamask: {
          CustodyController: {
            custodyAccountDetails: {
              '0x1': {
                custodianName: 'custodian1',
              },
            },
          } as unknown as CustodyControllerState,
          MmiConfigurationController: {
            mmiConfiguration: {
              custodians: [custodianMock],
            },
          } as unknown as MmiConfigurationControllerState,
        },
      };

      const isSupported = getIsNoteToTraderSupported(state, '0x1');

      expect(isSupported).toBe(true);
    });

    it('returns false if isNoteToTraderSupported is false for the custodian', () => {
      const state = {
        metamask: {
          CustodyController: {
            custodyAccountDetails: {
              '0x1': {
                custodianName: 'custodian1',
              },
            },
          } as unknown as CustodyControllerState,
          MmiConfigurationController: {
            mmiConfiguration: {
              custodians: [
                { ...custodianMock, isNoteToTraderSupported: false },
              ],
            },
          } as unknown as MmiConfigurationControllerState,
        },
      };

      const isSupported = getIsNoteToTraderSupported(state, '0x1');

      expect(isSupported).toBe(false);
    });

    it('returns false if custodyAccountDetails does not exist for the address', () => {
      const state = {
        metamask: {
          CustodyController: {
            custodyAccountDetails: {},
          },
          MmiConfigurationController: {
            mmiConfiguration: {
              custodians: [custodianMock],
            },
          },
        },
      };

      // @ts-expect-error Intentionally passing incomplete input for testing
      const isSupported = getIsNoteToTraderSupported(state, '0x1');

      expect(isSupported).toBe(false);
    });

    it('returns false if custodianName does not exist in custodyAccountDetails', () => {
      const state = {
        metamask: {
          CustodyController: {
            custodyAccountDetails: {
              '0x1': {
                custodianName: '',
              },
            },
          },
          MmiConfigurationController: {
            mmiConfiguration: {
              custodians: [custodianMock],
            },
          },
        },
      };

      // @ts-expect-error Intentionally passing incomplete input for testing
      const isSupported = getIsNoteToTraderSupported(state, '0x1');

      expect(isSupported).toBe(false);
    });

    it('returns false if custodianName does not match any custodian in mmiConfiguration', () => {
      const state = {
        metamask: {
          CustodyController: {
            custodyAccountDetails: {
              '0x1': {
                custodianName: 'custodian2',
              },
            },
          } as unknown as CustodyControllerState,
          MmiConfigurationController: {
            mmiConfiguration: {
              custodians: [custodianMock],
            },
          } as unknown as MmiConfigurationControllerState,
        },
      };

      const isSupported = getIsNoteToTraderSupported(state, '0x1');

      expect(isSupported).toBe(false);
    });

    it('returns false if mmiConfiguration or custodians is null', () => {
      const state = {
        metamask: {
          CustodyController: {
            custodyAccountDetails: {
              '0x1': {
                custodianName: 'custodian1',
              },
            },
          } as unknown as CustodyControllerState,
          MmiConfigurationController: {
            mmiConfiguration: undefined,
          },
        },
      };

      // @ts-expect-error Intentionally passing invalid input for testing
      const isSupported = getIsNoteToTraderSupported(state, '0x1');

      expect(isSupported).toBe(false);
    });
  });

  describe('getNoteToTraderMessage', () => {
    it('returns noteToTraderMessage if it exists', () => {
      const noteToTraderMessage = 'some message';
      const state = {
        metamask: {
          AppStateController: {
            noteToTraderMessage,
          },
        } as Pick<BackgroundStateProxy, 'AppStateController'>,
      };

      const token = getNoteToTraderMessage(state);

      expect(token).toStrictEqual(noteToTraderMessage);
    });

    it('returns an empty string if noteToTraderMessage does not exist', () => {
      const state = {
        metamask: { AppStateController: {} },
      };

      // @ts-expect-error Intentionally passing incomplete input for testing
      const token = getNoteToTraderMessage(state);

      expect(token).toStrictEqual('');
    });
  });
});
