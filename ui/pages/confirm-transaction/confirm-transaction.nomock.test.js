import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { renderWithProvider } from '../../../test/lib/render-helpers';
import { setBackgroundConnection } from '../../../test/jest';
import { INITIAL_SEND_STATE_FOR_EXISTING_DRAFT } from '../../../test/jest/mocks';
import { GasEstimateTypes } from '../../../shared/constants/gas';
import { HardwareKeyringTypes } from '../../../shared/constants/hardware-wallets';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { domainInitialState } from '../../ducks/domains';

import ConfirmTransaction from './confirm-transaction.container';
import { act, fireEvent } from '@testing-library/react';

const middleware = [thunk];

setBackgroundConnection({
  getGasFeeTimeEstimate: jest.fn(),
  getGasFeeEstimatesAndStartPolling: jest.fn(),
  promisifiedBackground: jest.fn(),
  tryReverseResolveAddress: jest.fn(),
  getNextNonce: jest.fn(),
});

const baseStore = {
  send: INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
  DNS: domainInitialState,
  gas: {
    customData: { limit: null, price: null },
  },
  history: { mostRecentOverviewPage: '/' },
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
    tokenList: {},
    ensResolutionsByAddress: {},
    snaps: {},
    knownMethodData: {
      '0x095ea7b3': {
        name: 'Approve',
      },
    },
  },
  confirmTransaction: {
    txData: {
      id: 1,
      time: 1675012496170,
      status: 'unapproved',
      metamaskNetworkId: '5',
      originalGasEstimate: '0x5208',
      userEditedGasLimit: false,
      chainId: CHAIN_IDS.GOERLI,
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

const sendWithApproveTransaction = {
  id: 5177046356058729,
  time: 1653457101080,
  status: 'submitted',
  metamaskNetworkId: '5',
  originalGasEstimate: '0xb427',
  userEditedGasLimit: false,
  chainId: CHAIN_IDS.GOERLI,
  loadingDefaults: false,
  dappSuggestedGasFees: {
    gasPrice: '0x4a817c800',
    gas: '0xb427',
  },
  sendFlowHistory: [],
  txParams: {
    from: '0x0',
    to: '0x85c1685cfceaa5c0bdb1609fc536e9a8387dd65e',
    nonce: '0x5',
    value: '0x5af3107a4000',
    data: '0x095ea7b30000000000000000000000002f318c334780961fb129d2a6c30d0763d9a5c9700000000000000000000000000000000000000000000000000000000000011170',
    gas: '0xb427',
    maxFeePerGas: '0x4a817c800',
    maxPriorityFeePerGas: '0x4a817c800',
  },
  origin: 'https://test.com',
  type: 'approve',
};

describe('Confirm Transaction', () => {
  it('should render correct information for approve transaction with value', () => {
    const sendWithApproveStore = {
      ...baseStore,
      metamask: {
        ...baseStore.metamask,
        unapprovedTxs: {
          [`${sendWithApproveTransaction.id}`]: sendWithApproveTransaction,
        },
      },
      confirmTransaction: {
        txData: sendWithApproveTransaction,
      },
    };
    const store = configureMockStore(middleware)(sendWithApproveStore);
    const { getByText, getByTitle, getByRole, getAllByText } =
      renderWithProvider(
        <ConfirmTransaction
          actionKey="confirm"
          tokenAddress={sendWithApproveTransaction.txParams.to}
          isSendWithApproval
        />,
        store,
        '/confirm-transaction/5177046356058729/send-ether',
      );
    expect(getAllByText('Approve')).toHaveLength(1);
    expect(getByText('0x85c...D65e')).toBeInTheDocument();
    expect(getByTitle('0.0001 ETH')).toBeInTheDocument();

    act(() => {
      const dataTabButton = getByRole('button', { name: 'Data' });
      fireEvent.click(dataTabButton);
    });
    expect(getAllByText('Approve')).toHaveLength(2);
    act(() => {
      const hexTabButton = getByRole('button', { name: 'Hex' });
      fireEvent.click(hexTabButton);
    });
    expect(
      getByText(sendWithApproveTransaction.txParams.data),
    ).toBeInTheDocument();
  });
});
