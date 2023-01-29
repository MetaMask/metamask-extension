import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../test/lib/render-helpers';
import thunk from 'redux-thunk';
import ConfirmTransactionBase from './confirm-transaction-base.container';
import { setBackgroundConnection } from '../../../test/jest';
import { INITIAL_SEND_STATE_FOR_EXISTING_DRAFT } from '../../../test/jest/mocks';
import { domainInitialState } from '../../ducks/domains';
import { GasEstimateTypes } from '../../../shared/constants/gas';
import { HardwareKeyringTypes } from '../../../shared/constants/hardware-wallets';
import { CHAIN_IDS } from '../../../shared/constants/network';

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
  tryReverseResolveAddress: jest.fn(),
  getNextNonce: jest.fn(),
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
          from: '0x0',
          to: '0x85c1685cfceaa5c0bdb1609fc536e9a8387dd65e',
          value: '0x5af3107a4000',
          gas: '0x5208',
          maxFeePerGas: '0x59682f16',
          maxPriorityFeePerGas: '0x59682f00',
          type: '0x2',
          data: 'data',
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
    ensResolutionsByAddress: {},
    snaps: {},
  },
  confirmTransaction: {
    txData: {
      id: 1,
      time: 1675012496170,
      status: 'unapproved',
      metamaskNetworkId: '5',
      originalGasEstimate: '0x5208',
      userEditedGasLimit: false,
      chainId: '0x5',
      loadingDefaults: false,
      dappSuggestedGasFees: null,
      sendFlowHistory: [],
      txParams: {
        from: '0x0',
        to: '0x85c1685cfceaa5c0bdb1609fc536e9a8387dd65e',
        value: '0x5af3107a4000',
        gas: '0x5208',
        maxFeePerGas: '0x59682f16',
        maxPriorityFeePerGas: '0x59682f00',
        type: '0x2',
      },
      origin: 'metamask',
      actionId: 1675012496153.2039,
      type: 'simpleSend',
      history: [],
      userFeeLevel: 'medium',
      defaultGasEstimates: {
        estimateType: 'medium',
        gas: '0x5208',
        maxFeePerGas: '0x59682f16',
        maxPriorityFeePerGas: '0x59682f00',
      },
    },
    tokenData: {},
    tokenProps: {},
    fiatTransactionAmount: '0.16',
    fiatTransactionFee: '0',
    fiatTransactionTotal: '0.16',
    ethTransactionAmount: '0.0001',
    ethTransactionFee: '0',
    ethTransactionTotal: '0.0001',
    hexTransactionAmount: '0x5af3107a4000',
    hexTransactionFee: '0x0',
    hexTransactionTotal: '0x5af3107a4000',
    nonce: '',
  },
  appState: {
    sendInputCurrencySwitched: false,
  },
};

describe('Confirm Transaction Base', () => {
  describe('render', () => {
    it('should match snapshot', () => {
      const store = configureMockStore(middleware)(baseStore);

      const { container } = renderWithProvider(
        <ConfirmTransactionBase actionKey="confirm" />,
        store,
      );
      expect(container).toMatchSnapshot();
    });
  });
});
