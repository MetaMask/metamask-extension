import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { renderWithProvider } from '../../../test/lib/render-helpers';
import { setBackgroundConnection } from '../../../test/jest';
import { INITIAL_SEND_STATE_FOR_EXISTING_DRAFT } from '../../../test/jest/mocks';
import { GasEstimateTypes } from '../../../shared/constants/gas';
import { KeyringType } from '../../../shared/constants/keyring';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { domainInitialState } from '../../ducks/domains';

import ConfirmTransactionBase from './confirm-transaction-base.container';

const middleware = [thunk];

setBackgroundConnection({
  getGasFeeTimeEstimate: jest.fn(),
  getGasFeeEstimatesAndStartPolling: jest.fn(),
  promisifiedBackground: jest.fn(),
  tryReverseResolveAddress: jest.fn(),
  getNextNonce: jest.fn(),
});

const baseStore = {
  send: {
    ...INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
    currentTransactionUUID: null,
    draftTransactions: {},
  },
  DNS: domainInitialState,
  gas: {
    customData: { limit: null, price: null },
  },
  history: { mostRecentOverviewPage: '/' },
  metamask: {
    unapprovedTxs: {
      1: {
        id: 1,
        metamaskNetworkId: '5',
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
        type: KeyringType.hdKeyTree,
        accounts: ['0x0'],
      },
    ],
    networkId: '5',
    networkDetails: {
      EIPS: {},
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
      '0x0': { balance: '0x0', address: '0x0' },
    },
    identities: { '0x0': { address: '0x0' } },
    tokenAddress: '0x32e6c34cd57087abbd59b5a4aecc4cb495924356',
    tokenList: {},
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
  it('should match snapshot', () => {
    const store = configureMockStore(middleware)(baseStore);
    const { container } = renderWithProvider(
      <ConfirmTransactionBase actionKey="confirm" />,
      store,
    );
    expect(container).toMatchSnapshot();
  });

  it('should contain L1 L2 fee details for optimism', () => {
    baseStore.metamask.providerConfig.chainId = CHAIN_IDS.OPTIMISM;
    baseStore.confirmTransaction.txData.chainId = CHAIN_IDS.OPTIMISM;
    const store = configureMockStore(middleware)(baseStore);
    const { getByText } = renderWithProvider(
      <ConfirmTransactionBase actionKey="confirm" />,
      store,
    );
    expect(getByText('Layer 1 fees')).toBeInTheDocument();
    expect(getByText('Layer 2 gas fee')).toBeInTheDocument();
  });
});
