import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { useLocation } from 'react-router-dom';
import { describe } from 'globalthis/implementation';
import { initialState, SEND_STAGES } from '../../ducks/send';
import { ensInitialState } from '../../ducks/ens';
import { renderWithProvider } from '../../../test/jest';
import { RINKEBY_CHAIN_ID } from '../../../shared/constants/network';
import Send from './send';

const middleware = [thunk];

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
  send: initialState,
  ENS: ensInitialState,
  gas: {
    basicEstimateStatus: 'READY',
    basicEstimates: { slow: '0x0', average: '0x1', fast: '0x2' },
    customData: { limit: null, price: null },
  },
  history: { mostRecentOverviewPage: 'activity' },
  metamask: {
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
    identities: { '0x0': {} },
  },
};

describe('Send Page', () => {
  describe('Send Flow Initialization', () => {
    it('should initialize the send, ENS, and gas slices on render', () => {
      const store = configureMockStore(middleware)(baseStore);
      renderWithProvider(<Send />, store);
      const actions = store.getActions();
      expect(actions).toStrictEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'ENS/enableEnsLookup',
          }),
          expect.objectContaining({
            type: 'send/initializeSendState/pending',
          }),
          expect.objectContaining({
            type: 'metamask/gas/BASIC_GAS_ESTIMATE_STATUS',
          }),
          expect.objectContaining({
            type: 'metamask/gas/SET_ESTIMATE_SOURCE',
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
            type: 'send/initializeSendState/pending',
          }),
          expect.objectContaining({
            type: 'metamask/gas/BASIC_GAS_ESTIMATE_STATUS',
          }),
          expect.objectContaining({
            type: 'metamask/gas/SET_ESTIMATE_SOURCE',
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

  describe('Add Recipient Flow', () => {
    it('should render the header with Add Recipient displayed', () => {
      const store = configureMockStore(middleware)(baseStore);
      const { getByText } = renderWithProvider(<Send />, store);
      expect(getByText('Add Recipient')).toBeTruthy();
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
  });

  describe('Send and Edit Flow', () => {
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
