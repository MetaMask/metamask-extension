import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { useLocation } from 'react-router-dom';
import { SEND_STAGES, startNewDraftTransaction } from '../../ducks/send';
import { domainInitialState } from '../../ducks/domains';
import { CHAIN_IDS } from '../../../shared/constants/network';
import {
  renderWithProvider,
  setBackgroundConnection,
} from '../../../test/jest';
import { GasEstimateTypes } from '../../../shared/constants/gas';
import { HardwareKeyringTypes } from '../../../shared/constants/hardware-wallets';
import { INITIAL_SEND_STATE_FOR_EXISTING_DRAFT } from '../../../test/jest/mocks';
import Send from './send';

const middleware = [thunk];

jest.mock('../../ducks/send/send', () => {
  const original = jest.requireActual('../../ducks/send/send');
  return {
    ...original,
    // We don't really need to start a draft transaction, and the mock store
    // does not update as a result of action calls so instead we just ensure
    // that the action WOULD be called.
    startNewDraftTransaction: jest.fn(() => ({
      type: 'TEST_START_NEW_DRAFT',
      payload: null,
    })),
  };
});

jest.mock('react-router-dom', () => {
  const original = jest.requireActual('react-router-dom');
  return {
    ...original,
    useLocation: jest.fn(() => ({ search: '' })),
    useHistory: () => ({
      push: jest.fn(),
    }),
  };
});

setBackgroundConnection({
  getGasFeeTimeEstimate: jest.fn(),
  getGasFeeEstimatesAndStartPolling: jest.fn(),
  promisifiedBackground: jest.fn(),
});

jest.mock('@ethersproject/providers', () => {
  const originalModule = jest.requireActual('@ethersproject/providers');
  return {
    ...originalModule,
    Web3Provider: jest.fn().mockImplementation(() => {
      return {};
    }),
  };
});
const baseStore = {
  send: INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
  DNS: domainInitialState,
  gas: {
    customData: { limit: null, price: null },
  },
  history: { mostRecentOverviewPage: 'activity' },
  metamask: {
    unapprovedTxs: {
      1: {
        id: 1,
        txParams: {
          value: 'oldTxValue',
        },
      },
    },
    gasEstimateType: GasEstimateTypes.legacy,
    gasFeeEstimates: {
      low: '0',
      medium: '1',
      fast: '2',
    },
    selectedAddress: '0x0',
    keyrings: [
      {
        type: HardwareKeyringTypes.hdKeyTree,
        accounts: ['0x0'],
      },
    ],
    networkDetails: {
      EIPS: {},
    },
    tokens: [],
    preferences: {
      useNativeCurrencyAsPrimaryCurrency: false,
    },
    currentCurrency: 'USD',
    provider: {
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
      '0x0': { balance: '0x0', address: '0x0' },
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

describe('Send Page', () => {
  describe('Send Flow Initialization', () => {
    it('should initialize the ENS slice on render', () => {
      const store = configureMockStore(middleware)(baseStore);
      renderWithProvider(<Send />, store);
      const actions = store.getActions();
      expect(actions).toStrictEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'DNS/enableDomainLookup',
          }),
        ]),
      );
    });

    it('should showQrScanner when location.search is ?scan=true', () => {
      useLocation.mockImplementation(() => ({ search: '?scan=true' }));
      const store = configureMockStore(middleware)(baseStore);
      renderWithProvider(<Send />, store);
      const actions = store.getActions();
      expect(actions).toStrictEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'DNS/enableDomainLookup',
          }),
          expect.objectContaining({
            type: 'UI_MODAL_OPEN',
            payload: { name: 'QR_SCANNER' },
          }),
        ]),
      );
      useLocation.mockImplementation(() => ({ search: '' }));
    });
  });

  describe('Send Flow', () => {
    it('should render the header with Send to displayed', () => {
      const store = configureMockStore(middleware)(baseStore);
      const { getByText } = renderWithProvider(<Send />, store);
      expect(getByText('Send to')).toBeTruthy();
    });

    it('should render the DomainInput field', () => {
      const store = configureMockStore(middleware)(baseStore);
      const { getByPlaceholderText } = renderWithProvider(<Send />, store);
      expect(
        getByPlaceholderText('Search, public address (0x), or ENS'),
      ).toBeTruthy();
    });

    it('should not render the footer', () => {
      const store = configureMockStore(middleware)(baseStore);
      const { queryByText } = renderWithProvider(<Send />, store);
      expect(queryByText('Next')).toBeNull();
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
      const { getByPlaceholderText } = renderWithProvider(<Send />, store);
      // Ensure that the send flow renders on the add recipient screen when
      // there is no draft transaction.
      expect(
        getByPlaceholderText('Search, public address (0x), or ENS'),
      ).toBeTruthy();
      // Ensure we start a new draft transaction when its missing.
      expect(startNewDraftTransaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('Send and Edit Flow (draft)', () => {
    it('should render the header with Send displayed', () => {
      const store = configureMockStore(middleware)({
        ...baseStore,
        send: { ...baseStore.send, stage: SEND_STAGES.DRAFT },
        confirmTransaction: {
          txData: {
            id: 3111025347726181,
            time: 1620723786838,
            status: 'unapproved',
            metamaskNetworkId: '5',
            chainId: '0x5',
            loadingDefaults: false,
            txParams: {
              from: '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4',
              to: '0xaD6D458402F60fD3Bd25163575031ACDce07538D',
              value: '0x0',
              data: '0x095ea7b30000000000000000000000009bc5baf874d2da8d216ae9f137804184ee5afef40000000000000000000000000000000000000000000000000000000000011170',
              gas: '0xea60',
              gasPrice: '0x4a817c800',
            },
            type: 'transfer',
            origin: 'https://metamask.github.io',
            transactionCategory: 'approve',
          },
        },
      });
      const { getByText } = renderWithProvider(<Send />, store);
      expect(getByText('Send')).toBeTruthy();
    });

    it('should render the DomainInput field', () => {
      const store = configureMockStore(middleware)(baseStore);
      const { getByPlaceholderText } = renderWithProvider(<Send />, store);
      expect(
        getByPlaceholderText('Search, public address (0x), or ENS'),
      ).toBeTruthy();
    });

    it('should render the footer', () => {
      const store = configureMockStore(middleware)({
        ...baseStore,
        send: { ...baseStore.send, stage: SEND_STAGES.DRAFT },
        confirmTransaction: {
          txData: {
            id: 3111025347726181,
            time: 1620723786838,
            status: 'unapproved',
            metamaskNetworkId: '5',
            chainId: '0x5',
            loadingDefaults: false,
            txParams: {
              from: '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4',
              to: '0xaD6D458402F60fD3Bd25163575031ACDce07538D',
              value: '0x0',
              data: '0x095ea7b30000000000000000000000009bc5baf874d2da8d216ae9f137804184ee5afef40000000000000000000000000000000000000000000000000000000000011170',
              gas: '0xea60',
              gasPrice: '0x4a817c800',
            },
            type: 'transfer',
            origin: 'https://metamask.github.io',
            transactionCategory: 'approve',
          },
        },
      });
      const { getByText } = renderWithProvider(<Send />, store);
      expect(getByText('Next')).toBeTruthy();
    });
  });
});
