import React from 'react';
import thunk from 'redux-thunk';
import configureMockStore from 'redux-mock-store';
import { EthAccountType, EthScope } from '@metamask/keyring-api';
import { act } from '@testing-library/react';
import { AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS } from '@metamask/multichain-network-controller';
import {
  renderWithProvider,
  waitFor,
  fireEvent,
} from '../../../../../test/jest';
import { domainInitialState } from '../../../../ducks/domains';
import { INITIAL_SEND_STATE_FOR_EXISTING_DRAFT } from '../../../../../test/jest/mocks';
import { GasEstimateTypes } from '../../../../../shared/constants/gas';
import {
  SEND_STAGES,
  SEND_STATUSES,
  startNewDraftTransaction,
} from '../../../../ducks/send';
import { AssetType } from '../../../../../shared/constants/transaction';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import mockSendState from '../../../../../test/data/mock-send-state.json';
import { useIsOriginalNativeTokenSymbol } from '../../../../hooks/useIsOriginalNativeTokenSymbol';
import { KeyringType } from '../../../../../shared/constants/keyring';
import { ETH_EOA_METHODS } from '../../../../../shared/constants/eth-methods';
import { mockNetworkState } from '../../../../../test/stub/networks';
import { SendPage } from '.';

jest.mock('@ethersproject/providers', () => {
  const originalModule = jest.requireActual('@ethersproject/providers');
  return {
    ...originalModule,
    Web3Provider: jest.fn().mockImplementation(() => {
      return {};
    }),
  };
});

jest.mock('../../../../hooks/useIsOriginalNativeTokenSymbol', () => {
  return {
    useIsOriginalNativeTokenSymbol: jest.fn(),
  };
});

const mockCancelTx = jest.fn();
jest.mock('../../../../store/actions.ts', () => {
  const originalModule = jest.requireActual('../../../../store/actions.ts');
  return {
    ...originalModule,
    gasFeeStartPollingByNetworkClientId: jest
      .fn()
      .mockResolvedValue('pollingToken'),
    gasFeeStopPollingByPollingToken: jest.fn(),
    getNetworkConfigurationByNetworkClientId: jest
      .fn()
      .mockResolvedValue({ chainId: '0x5' }),
    getTokenSymbol: jest.fn().mockResolvedValue('ETH'),
    getGasFeeTimeEstimate: jest
      .fn()
      .mockImplementation(() => Promise.resolve()),
    cancelTx: () => mockCancelTx,
  };
});

const mockResetSendState = jest.fn();
jest.mock('../../../../ducks/send/send', () => {
  const originalModule = jest.requireActual('../../../../ducks/send/send');
  return {
    ...originalModule,
    // We don't really need to start a draft transaction, and the mock store
    // does not update as a result of action calls so instead we just ensure
    // that the action WOULD be called.
    startNewDraftTransaction: jest.fn(() => ({
      type: 'TEST_START_NEW_DRAFT',
      payload: null,
    })),
    resetSendState: () => mockResetSendState,
  };
});

const baseStore = {
  send: INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
  DNS: domainInitialState,
  gas: {
    customData: { limit: null, price: null },
  },
  history: { mostRecentOverviewPage: 'activity' },
  confirmTransaction: {
    txData: {
      id: 1,
      txParams: {
        value: 'oldTxValue',
      },
    },
  },
  metamask: {
    accountsByChainId: {},
    permissionHistory: {},
    transactions: [
      {
        id: 1,
        txParams: {
          value: 'oldTxValue',
        },
      },
    ],
    tokenBalances: {
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
        '0x5': {},
      },
    },
    currencyRates: {
      ETH: {
        conversionDate: 1620710825.03,
        conversionRate: 3910.28,
        usdConversionRate: 3910.28,
      },
    },
    gasEstimateType: GasEstimateTypes.legacy,
    gasFeeEstimates: {
      low: '0',
      medium: '1',
      fast: '2',
    },
    gasFeeEstimatesByChainId: {
      '0x5': {
        gasFeeEstimates: {
          low: '0',
          medium: '1',
          fast: '2',
        },
        gasEstimateType: GasEstimateTypes.legacy,
      },
    },
    internalAccounts: {
      accounts: {
        'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
          address: '0x0',
          id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
          metadata: {
            name: 'Test Account',
            keyring: {
              type: 'HD Key Tree',
            },
          },
          options: {},
          methods: ETH_EOA_METHODS,
          scopes: [EthScope.Eoa],
          type: EthAccountType.Eoa,
        },
      },
      selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
    },
    keyrings: [
      {
        type: KeyringType.hdKeyTree,
        accounts: ['0x0'],
        metadata: {
          id: 'test-keyring-id',
          name: '',
        },
      },
    ],
    ...mockNetworkState({
      chainId: CHAIN_IDS.GOERLI,
      ticker: 'ETH',
    }),
    tokens: [],
    preferences: {
      showFiatInTestnets: true,
      tokenNetworkFilter: {},
    },
    enabledNetworkMap: {
      eip155: {},
    },
    currentCurrency: 'USD',
    nativeCurrency: 'ETH',
    featureFlags: {
      sendHexData: false,
    },
    networkConfigurationsByChainId: {
      '0x1': {
        chainId: '0x1',
        name: 'Custom Mainnet RPC',
        nativeCurrency: 'ETH',
        defaultRpcEndpointIndex: 0,
        ticker: 'ETH',
        rpcEndpoints: [
          {
            type: 'custom',
            url: 'https://testrpc.com',
            networkClientId: 'testNetworkConfigurationId',
          },
        ],
        blockExplorerUrls: [],
      },
      '0x5': {
        chainId: '0x5',
        name: 'Goerli',
        nativeCurrency: 'ETH',
        defaultRpcEndpointIndex: 0,
        ticker: 'ETH',
        rpcEndpoints: [
          {
            type: 'custom',
            url: 'https://goerli.com',
            networkClientId: 'goerli',
          },
        ],
        blockExplorerUrls: [],
      },
    },
    selectedNetworkClientId: 'goerli',
    networksMetadata: {
      goerli: {
        EIPS: {
          1559: true,
        },
        status: 'available',
      },
    },
    multichainNetworkConfigurationsByChainId: {
      'bip122:000000000019d6689c085ae165831e93': {
        chainId: 'bip122:000000000019d6689c085ae165831e93',
        name: 'Bitcoin',
        nativeCurrency: 'bip122:000000000019d6689c085ae165831e93/slip44:0',
        isEvm: false,
      },
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': {
        chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
        name: 'Solana',
        nativeCurrency: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
        isEvm: false,
      },
    },
    addressBook: {
      [CHAIN_IDS.GOERLI]: [],
    },
    cachedBalances: {
      [CHAIN_IDS.GOERLI]: {},
    },
    accounts: {
      '0x0': { balance: '0x0', address: '0x0', name: 'Account 1' },
    },
    tokenAddress: '0x32e6c34cd57087abbd59b5a4aecc4cb495924356',
    tokenList: {
      '0x32e6c34cd57087abbd59b5a4aecc4cb495924356': {
        name: 'BitBase',
        symbol: 'BTBS',
        decimals: 18,
        address: '0x32E6C34Cd57087aBBD59B5A4AECC4cB495924356',
        iconUrl: 'BTBS.svg',
        occurrences: null,
      },
      '0x3fa400483487a489ec9b1db29c4129063eec4654': {
        name: 'Cryptokek.com',
        symbol: 'KEK',
        decimals: 18,
        address: '0x3fa400483487A489EC9b1dB29C4129063EEC4654',
        iconUrl: 'cryptokek.svg',
        occurrences: null,
      },
    },
    completedOnboarding: true,
    useCurrencyRateCheck: true,
    ticker: 'ETH',
    snaps: {},
  },
  localeMessages: {
    currentLocale: 'en',
  },
  activeTab: {
    origin: 'https://uniswap.org/',
  },
  appState: {
    sendInputCurrencySwitched: false,
  },
};

const render = async (state) => {
  const middleware = [thunk];

  const store = configureMockStore(middleware)(state);

  let result;

  await act(async () => (result = renderWithProvider(<SendPage />, store)));

  return { store, result };
};

describe('SendPage', () => {
  describe('render and initialization', () => {
    it('should initialize the ENS slice on render', async () => {
      const { store } = await render({
        ...baseStore,
        metamask: {
          ...baseStore.metamask,
          pinnedAccountList: [
            '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b',
            '0xeb9e64b93097bc15f01f13eae97015c57ab64823',
          ],
          hiddenAccountList: [],
          multichainNetworkConfigurationsByChainId:
            AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS,
          selectedMultichainNetworkChainId: 'eip155:1',
          isEvmSelected: true,
        },
      });
      const actions = store.getActions();
      expect(actions).toStrictEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'DNS/enableDomainLookup',
          }),
        ]),
      );
    });

    it('should render correctly even when a draftTransaction does not exist', async () => {
      const modifiedState = {
        ...baseStore,
        metamask: {
          ...baseStore.metamask,
          pinnedAccountList: [
            '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b',
            '0xeb9e64b93097bc15f01f13eae97015c57ab64823',
          ],
          hiddenAccountList: [],
          multichainNetworkConfigurationsByChainId:
            AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS,
          selectedMultichainNetworkChainId: 'eip155:1',
          isEvmSelected: true,
        },
        send: {
          ...baseStore.send,
          currentTransactionUUID: null,
        },
      };
      const {
        result: { container, getByTestId, getByPlaceholderText },
      } = await render(modifiedState);

      // Ensure that the send flow renders on the add recipient screen when
      // there is no draft transaction.
      expect(
        getByPlaceholderText('Enter public address (0x) or domain name'),
      ).toBeTruthy();

      expect(container).toMatchSnapshot();
      expect(getByTestId('send-page-account-picker')).toBeInTheDocument();

      // Ensure we start a new draft transaction when its missing.
      expect(startNewDraftTransaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('footer buttons', () => {
    describe('onCancel', () => {
      it('should call reset send state and route to recent page without cancelling tx', async () => {
        const {
          result: { queryByText },
        } = await render(mockSendState);

        const cancelText = queryByText('Cancel');
        await act(async () => {
          fireEvent.click(cancelText);
        });

        expect(mockResetSendState).toHaveBeenCalled();
        expect(mockCancelTx).not.toHaveBeenCalled();
      });

      it('should reject/cancel tx when coming from tx editing and route to index', async () => {
        const sendDataState = {
          ...mockSendState,
          send: {
            currentTransactionUUID: '01',
            draftTransactions: {
              '01': {
                id: '99',
                amount: {
                  value: '0x1',
                },
                sendAsset: {
                  type: AssetType.token,
                  balance: '0xaf',
                  details: {},
                },
                receiveAsset: {
                  type: AssetType.token,
                  balance: '0xaf',
                  details: {},
                },
                gas: {},
              },
            },
            stage: SEND_STAGES.EDIT,
          },
        };

        const {
          result: { queryByText },
        } = await render(sendDataState);

        const rejectText = queryByText('Reject');
        await act(async () => {
          fireEvent.click(rejectText);
        });

        expect(mockResetSendState).toHaveBeenCalled();
        expect(mockCancelTx).toHaveBeenCalled();
      });
    });
  });

  describe('Recipient Warning', () => {
    useIsOriginalNativeTokenSymbol.mockReturnValue(true);

    it('should show recipient warning with knownAddressRecipient state in draft transaction state', async () => {
      const knownRecipientWarningState = {
        ...mockSendState,
        send: {
          ...mockSendState.send,
          currentTransactionUUID: '1-tx',
          draftTransactions: {
            '1-tx': {
              ...mockSendState.send.draftTransactions['1-tx'],
              recipient: {
                ...mockSendState.send.draftTransactions['1-tx'].recipient,
                warning: 'knownAddressRecipient',
              },
            },
          },
        },
        metamask: {
          ...mockSendState.metamask,
          gasEstimateType: 'none',
          ...mockNetworkState({ chainId: CHAIN_IDS.GOERLI }),
        },
      };

      const {
        result: { queryByTestId },
      } = await render(knownRecipientWarningState);

      const sendWarning = queryByTestId('send-warning');
      await waitFor(() => {
        expect(sendWarning).toBeInTheDocument();
      });
    });
  });

  describe('Submit Button', () => {
    it('starts with the button enabled', async () => {
      const {
        result: { getByText },
      } = await render(mockSendState);

      const submitButton = getByText('Continue');
      expect(submitButton).toBeEnabled();
    });

    describe('disables the button when', () => {
      it('invalid send form', async () => {
        const invalidFormState = {
          ...mockSendState,
          send: {
            ...mockSendState.send,
            currentTransactionUUID: '1-tx',
            draftTransactions: {
              '1-tx': {
                ...mockSendState.send.draftTransactions['1-tx'],
                status: SEND_STATUSES.INVALID,
              },
            },
          },
        };

        const {
          result: { getByText },
        } = await render(invalidFormState);

        const submitButton = getByText('Continue');

        expect(submitButton).toBeDisabled();
      });

      it('recipient warning is present', async () => {
        const recipientWarningState = {
          ...mockSendState,
          send: {
            ...mockSendState.send,
            currentTransactionUUID: '1-tx',
            draftTransactions: {
              '1-tx': {
                ...mockSendState.send.draftTransactions['1-tx'],
                recipient: {
                  ...mockSendState.send.draftTransactions['1-tx'].recipient,
                  warning: 'knownAddressRecipient',
                },
              },
            },
          },
        };

        const {
          result: { getByText },
        } = await render(recipientWarningState);

        const submitButton = getByText('Continue');
        expect(submitButton).toBeDisabled();
      });

      it('hex data is invalid', async () => {
        const hexDataInvalidState = {
          ...mockSendState,
          send: {
            ...mockSendState.send,
            currentTransactionUUID: '1-tx',
            draftTransactions: {
              '1-tx': {
                ...mockSendState.send.draftTransactions['1-tx'],
                hexData: {
                  error: 'invalidHexDataError',
                },
              },
            },
          },
        };

        const {
          result: { getByText },
        } = await render(hexDataInvalidState);

        const submitButton = getByText('Continue');
        expect(submitButton).toBeDisabled();
      });

      it('smart transaction is pending and isSwapAndSend is true', async () => {
        const smartTransactionPendingState = {
          ...mockSendState,
          metamask: {
            ...mockSendState.metamask,
            smartTransactionsState: {
              smartTransactions: {
                [CHAIN_IDS.GOERLI]: [
                  {
                    uuid: 'uuid2',
                    status: 'pending',
                    cancellable: true,
                    txParams: {
                      from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
                    },
                    statusMetadata: {
                      cancellationFeeWei: 36777567771000,
                      cancellationReason: 'not_cancelled',
                      deadlineRatio: 0.6400288486480713,
                      minedHash:
                        '0x55ad39634ee10d417b6e190cfd3736098957e958879cffe78f1f00f4fd2654d6',
                      minedTx: 'success',
                    },
                  },
                ],
              },
            },
          },
          send: {
            ...mockSendState.send,
            currentTransactionUUID: '1-tx',
            draftTransactions: {
              '1-tx': {
                ...mockSendState.send.draftTransactions['1-tx'],
                sendAsset: {
                  details: {
                    address: '0x123',
                  },
                },
                receiveAsset: {
                  details: {
                    address: '0x456',
                  },
                },
              },
            },
          },
        };

        const {
          result: { getByText },
        } = await render(smartTransactionPendingState);

        const submitButton = getByText('Confirm');
        expect(submitButton).toBeDisabled();
      });

      it('there is an insufficient funds for gas error', async () => {
        const insufficientFundsState = {
          ...mockSendState,
          send: {
            ...mockSendState.send,
            currentTransactionUUID: '1-tx',
            draftTransactions: {
              '1-tx': {
                ...mockSendState.send.draftTransactions['1-tx'],
                gas: {
                  error: 'insufficientFunds',
                },
              },
            },
          },
        };

        const {
          result: { getByText },
        } = await render(insufficientFundsState);

        const submitButton = getByText('Continue');
        expect(submitButton).toBeEnabled();
      });

      it('there is an insufficient funds error', async () => {
        const insufficientFundsState = {
          ...mockSendState,
          send: {
            ...mockSendState.send,
            currentTransactionUUID: '1-tx',
            draftTransactions: {
              '1-tx': {
                ...mockSendState.send.draftTransactions['1-tx'],
                amount: {
                  error: 'insufficientFunds',
                },
              },
            },
          },
        };

        const {
          result: { getByText },
        } = await render(insufficientFundsState);

        const submitButton = getByText('Continue');
        expect(submitButton).toBeDisabled();
      });
    });
  });
});
