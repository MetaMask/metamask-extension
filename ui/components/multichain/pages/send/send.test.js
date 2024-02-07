import React from 'react';
import thunk from 'redux-thunk';
import configureMockStore from 'redux-mock-store';
import { NetworkType } from '@metamask/controller-utils';
import { EthAccountType, EthMethod } from '@metamask/keyring-api';
import mockState from '../../../../../test/data/mock-state.json';
import {
  renderWithProvider,
  waitFor,
  fireEvent,
} from '../../../../../test/jest';
import { domainInitialState } from '../../../../ducks/domains';
import { INITIAL_SEND_STATE_FOR_EXISTING_DRAFT } from '../../../../../test/jest/mocks';
import { GasEstimateTypes } from '../../../../../shared/constants/gas';
import { KeyringType } from '../../../../../shared/constants/keyring';
import { SEND_STAGES, startNewDraftTransaction } from '../../../../ducks/send';
import { AssetType } from '../../../../../shared/constants/transaction';
import {
  CHAIN_IDS,
  GOERLI_DISPLAY_NAME,
  NETWORK_TYPES,
} from '../../../../../shared/constants/network';
import mockSendState from '../../../../../test/data/mock-send-state.json';
import { useIsOriginalNativeTokenSymbol } from '../../../../hooks/useIsOriginalNativeTokenSymbol';
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
    disconnectGasFeeEstimatePoller: jest.fn(),
    getGasFeeEstimatesAndStartPolling: jest
      .fn()
      .mockImplementation(() => Promise.resolve()),
    addPollingTokenToAppState: jest.fn(),
    removePollingTokenFromAppState: jest.fn(),
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

describe('SendPage', () => {
  describe('render and initialization', () => {
    const middleware = [thunk];

    const baseStore = {
      send: INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
      DNS: domainInitialState,
      gas: {
        customData: { limit: null, price: null },
      },
      history: { mostRecentOverviewPage: 'activity' },
      metamask: {
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
          },
          selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
        },
        keyrings: [
          {
            type: KeyringType.hdKeyTree,
            accounts: ['0x0'],
          },
        ],
        selectedNetworkClientId: NetworkType.mainnet,
        networksMetadata: {
          [NetworkType.mainnet]: {
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
      appState: {
        sendInputCurrencySwitched: false,
      },
    };

    it('should initialize the ENS slice on render', () => {
      const store = configureMockStore(middleware)(baseStore);
      renderWithProvider(<SendPage />, store);
      const actions = store.getActions();
      expect(actions).toStrictEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'DNS/enableDomainLookup',
          }),
        ]),
      );
    });

    it('should render correctly even when a draftTransaction does not exist', () => {
      const modifiedStore = {
        ...baseStore,
        send: {
          ...baseStore.send,
          currentTransactionUUID: null,
        },
      };
      const store = configureMockStore(middleware)(modifiedStore);
      const { container, getByTestId, getByPlaceholderText } =
        renderWithProvider(<SendPage />, store);

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
    const mockStore = configureMockStore([thunk])(mockState);

    describe('onCancel', () => {
      it('should call reset send state and route to recent page without cancelling tx', () => {
        const { queryByText } = renderWithProvider(<SendPage />, mockStore);

        const cancelText = queryByText('Cancel');
        fireEvent.click(cancelText);

        expect(mockResetSendState).toHaveBeenCalled();
        expect(mockCancelTx).not.toHaveBeenCalled();
      });

      it('should reject/cancel tx when coming from tx editing and route to index', () => {
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

        const sendStateStore = configureMockStore([thunk])(sendDataState);

        const { queryByText } = renderWithProvider(
          <SendPage />,
          sendStateStore,
        );

        const rejectText = queryByText('Reject');
        fireEvent.click(rejectText);

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

      const sendStateStore = configureMockStore([thunk])(
        knownRecipientWarningState,
      );

      const { queryByTestId } = renderWithProvider(
        <SendPage />,
        sendStateStore,
      );

      const sendWarning = queryByTestId('send-warning');
      await waitFor(() => {
        expect(sendWarning).toBeInTheDocument();
      });
    });
  });
});
