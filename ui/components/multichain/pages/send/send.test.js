import React from 'react';
import thunk from 'redux-thunk';
import configureMockStore from 'redux-mock-store';
import { NetworkType } from '@metamask/controller-utils';
import { EthAccountType, EthMethod } from '@metamask/keyring-api';
import { act } from '@testing-library/react';
import mockState from '../../../../../test/data/mock-state.json';
import {
  renderWithProvider,
  waitFor,
  fireEvent,
} from '../../../../../test/jest';
import { domainInitialState } from '../../../../ducks/domains';
import { INITIAL_SEND_STATE_FOR_EXISTING_DRAFT } from '../../../../../test/jest/mocks';
import { GasEstimateTypes } from '../../../../../shared/constants/gas';
import { SEND_STAGES, startNewDraftTransaction } from '../../../../ducks/send';
import { AssetType } from '../../../../../shared/constants/transaction';
import {
  CHAIN_IDS,
  GOERLI_DISPLAY_NAME,
  NETWORK_TYPES,
} from '../../../../../shared/constants/network';
import mockSendState from '../../../../../test/data/mock-send-state.json';
import { useIsOriginalNativeTokenSymbol } from '../../../../hooks/useIsOriginalNativeTokenSymbol';
import { KeyringType } from '../../../../../shared/constants/keyring';
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
    permissionHistory: {},
    transactions: [
      {
        id: 1,
        txParams: {
          value: 'oldTxValue',
        },
      },
    ],

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
    selectedAddress: '0x0',
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
          methods: [...Object.values(EthMethod)],
          type: EthAccountType.Eoa,
        },
        permissionHistory: {
          'https://uniswap.org/': {
            eth_accounts: {
              accounts: {
                '0x0': 1709225290848,
              },
            },
          },
        },
      },
      activeTab: {
        origin: 'https://uniswap.org/',
      },
      appState: {
        sendInputCurrencySwitched: false,
      },
      selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
    },
    keyrings: [
      {
        type: KeyringType.hdKeyTree,
        accounts: ['0x0'],
      },
    ],
    selectedNetworkClientId: NetworkType.goerli,
    networksMetadata: {
      [NetworkType.goerli]: {
        EIPS: {},
        status: 'available',
      },
    },
    tokens: [],
    preferences: {
      useNativeCurrencyAsPrimaryCurrency: false,
    },
    currentCurrency: 'USD',
    providerConfig: {
      chainId: CHAIN_IDS.GOERLI,
      nickname: GOERLI_DISPLAY_NAME,
    },
    nativeCurrency: 'ETH',
    featureFlags: {
      sendHexData: false,
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
    identities: { '0x0': { address: '0x0' } },
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
        getByPlaceholderText('Enter public address (0x) or ENS name'),
      ).toBeTruthy();

      expect(container).toMatchSnapshot();
      expect(getByTestId('send-page-network-picker')).toBeInTheDocument();
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
        } = await render(mockState);

        const cancelText = queryByText('Cancel');
        await act(async () => {
          fireEvent.click(cancelText);
        });

        expect(mockResetSendState).toHaveBeenCalled();
        expect(mockCancelTx).not.toHaveBeenCalled();
      });

      it('should reject/cancel tx when coming from tx editing and route to index', async () => {
        const sendDataState = {
          ...mockState,
          send: {
            currentTransactionUUID: '01',
            draftTransactions: {
              '01': {
                id: '99',
                amount: {
                  value: '0x1',
                },
                asset: {
                  type: AssetType.token,
                  balance: '0xaf',
                  details: {},
                },
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
          providerConfig: {
            chainId: CHAIN_IDS.GOERLI,
            nickname: GOERLI_DISPLAY_NAME,
            type: NETWORK_TYPES.GOERLI,
          },
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
});
