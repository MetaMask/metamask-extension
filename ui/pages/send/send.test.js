import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { useLocation } from 'react-router-dom';
import { SEND_STAGES, startNewDraftTransaction } from '../../ducks/send';
import { ensInitialState } from '../../ducks/ens';
import { renderWithProvider } from '../../../test/jest';
import { RINKEBY_CHAIN_ID } from '../../../shared/constants/network';
import { GAS_ESTIMATE_TYPES } from '../../../shared/constants/gas';
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

jest.mock(
  'ethjs-ens',
  () =>
    class MocKENS {
      async ensLookup() {
        return '';
      }
    },
);

const baseStore = {
  send: INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
  ENS: ensInitialState,
  gas: {
    customData: { limit: null, price: null },
  },
  history: { mostRecentOverviewPage: 'activity' },
  metamask: {
    gasEstimateType: GAS_ESTIMATE_TYPES.LEGACY,
    gasFeeEstimates: {
      low: '0',
      medium: '1',
      fast: '2',
    },
    selectedAddress: '0x0',
    keyrings: [
      {
        type: 'HD Key Tree',
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
      chainId: RINKEBY_CHAIN_ID,
    },
    nativeCurrency: 'ETH',
    featureFlags: {
      sendHexData: false,
    },
    addressBook: {
      [RINKEBY_CHAIN_ID]: [],
    },
    cachedBalances: {
      [RINKEBY_CHAIN_ID]: {},
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
            type: 'ENS/enableEnsLookup',
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
            type: 'ENS/enableEnsLookup',
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

    it('should render the EnsInput field', () => {
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
      });
      const { getByText } = renderWithProvider(<Send />, store);
      expect(getByText('Send')).toBeTruthy();
    });

    it('should render the EnsInput field', () => {
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
      });
      const { getByText } = renderWithProvider(<Send />, store);
      expect(getByText('Next')).toBeTruthy();
    });
  });
});
