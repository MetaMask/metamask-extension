import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { renderWithProvider } from '../../../test/lib/render-helpers';
import { setBackgroundConnection } from '../../../test/jest';
import { INITIAL_SEND_STATE_FOR_EXISTING_DRAFT } from '../../../test/jest/mocks';
import { GasEstimateTypes } from '../../../shared/constants/gas';
import { KeyringType } from '../../../shared/constants/keyring';
import { CHAIN_IDS } from '../../../shared/constants/network';
import {
  TransactionStatus,
  TransactionType,
} from '../../../shared/constants/transaction';
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

const mockNetworkId = '5';

const mockTxParamsFromAddress = '0x123456789';

const mockTxParamsToAddress = '0x85c1685cfceaa5c0bdb1609fc536e9a8387dd65e';
const mockTxParamsToAddressConcat = '0x85c...D65e';

const mockContractAddressWithout0x = 'e57e7847fd3661a9b7c86aaf1daea08d9da5750a';
const mockContractAddressConcat = '0xe57...750A';

const mockTxParams = {
  from: mockTxParamsFromAddress,
  to: mockTxParamsToAddress,
  value: '0x5af3107a4000',
  gas: '0x5208',
  maxFeePerGas: '0x59682f16',
  maxPriorityFeePerGas: '0x59682f00',
  type: '0x2',
  data: `0xa22cb465000000000000000000000000${mockContractAddressWithout0x}0000000000000000000000000000000000000000000000000000000000000001`,
};

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
        metamaskNetworkId: mockNetworkId,
        txParams: { ...mockTxParams },
      },
    },
    gasEstimateType: GasEstimateTypes.legacy,
    gasFeeEstimates: {
      low: '0',
      medium: '1',
      fast: '2',
    },
    selectedAddress: mockTxParamsFromAddress,
    keyrings: [
      {
        type: KeyringType.hdKeyTree,
        accounts: ['0x0'],
      },
    ],
    networkId: mockNetworkId,
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
      [mockTxParamsFromAddress]: {
        balance: '0x0',
        address: mockTxParamsFromAddress,
      },
    },
    identities: {
      [mockTxParamsFromAddress]: { address: mockTxParamsFromAddress },
      [mockTxParamsToAddress]: {
        name: 'Test Address 1',
      },
    },
    tokenAddress: '0x32e6c34cd57087abbd59b5a4aecc4cb495924356',
    tokenList: {},
    ensResolutionsByAddress: {},
    snaps: {},
  },
  confirmTransaction: {
    txData: {
      id: 1,
      metamaskNetworkId: mockNetworkId,
      txParams: { ...mockTxParams },
      time: 1675012496170,
      status: TransactionStatus.unapproved,
      originalGasEstimate: '0x5208',
      userEditedGasLimit: false,
      chainId: '0x5',
      loadingDefaults: false,
      dappSuggestedGasFees: null,
      sendFlowHistory: [],
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

const mockedStore = jest.mocked(baseStore);

const mockedStoreWithConfirmTxParams = (_mockTxParams = mockTxParams) => {
  mockedStore.metamask.unapprovedTxs[1].txParams = { ..._mockTxParams };
  mockedStore.confirmTransaction.txData.txParams = { ..._mockTxParams };
};

const sendToRecipientSelector =
  '.sender-to-recipient__party--recipient .sender-to-recipient__name';

describe('Confirm Transaction Base', () => {
  it('should match snapshot', () => {
    const store = configureMockStore(middleware)(baseStore);
    const { container } = renderWithProvider(
      <ConfirmTransactionBase actionKey="confirm" />,
      store,
    );
    expect(container).toMatchSnapshot();
  });

  it('should not contain L1 L2 fee details for chains that are not optimism', () => {
    const store = configureMockStore(middleware)(baseStore);
    const { queryByText } = renderWithProvider(
      <ConfirmTransactionBase actionKey="confirm" />,
      store,
    );
    expect(queryByText('Layer 1 fees')).not.toBeInTheDocument();
    expect(queryByText('Layer 2 gas fee')).not.toBeInTheDocument();
  });

  it('should contain L1 L2 fee details for optimism', () => {
    mockedStore.metamask.provider.chainId = CHAIN_IDS.OPTIMISM;
    mockedStore.confirmTransaction.txData.chainId = CHAIN_IDS.OPTIMISM;
    const store = configureMockStore(middleware)(mockedStore);
    const { queryByText } = renderWithProvider(
      <ConfirmTransactionBase actionKey="confirm" />,
      store,
    );
    expect(queryByText('Layer 1 fees')).toBeInTheDocument();
    expect(queryByText('Layer 2 gas fee')).toBeInTheDocument();
  });

  describe(`when the transaction is a ${TransactionType.simpleSend} type`, () => {
    it('should use txParams.to address as the recipient value', () => {
      const store = configureMockStore(middleware)(mockedStore);
      const { container } = renderWithProvider(
        <ConfirmTransactionBase actionKey="confirm" />,
        store,
      );

      const recipientElem = container.querySelector(sendToRecipientSelector);
      expect(recipientElem).toHaveTextContent(mockTxParamsToAddressConcat);
    });

    it('should use txParams.to address as the recipient value even when no value is passed', () => {
      mockedStoreWithConfirmTxParams({
        ...mockTxParams,
        value: '0x0',
      });
      const store = configureMockStore(middleware)(mockedStore);
      const { container } = renderWithProvider(
        <ConfirmTransactionBase actionKey="confirm" />,
        store,
      );

      const recipientElem = container.querySelector(sendToRecipientSelector);
      expect(recipientElem).toHaveTextContent(mockTxParamsToAddressConcat);
    });
  });

  describe('when the transaction is a contract interaction', () => {
    beforeEach(() => {
      mockedStore.confirmTransaction.txData.type =
        TransactionType.contractInteraction;
    });

    it('should use the token to address as the recipient address', () => {
      mockedStoreWithConfirmTxParams({
        ...mockTxParams,
        value: '0x0',
      });
      const store = configureMockStore(middleware)(mockedStore);
      const { container } = renderWithProvider(
        <ConfirmTransactionBase actionKey="confirm" />,
        store,
      );

      const recipientElem = container.querySelector(sendToRecipientSelector);
      expect(recipientElem).toHaveTextContent(mockContractAddressConcat);
    });

    describe('when there is a value being sent it should be treated as a general contract intereaction rather than custom one', () => {
      it('should use txParams.to address (contract address) as the recipient address', () => {
        mockedStoreWithConfirmTxParams({
          ...mockTxParams,
          value: '0x45666',
        });
        const store = configureMockStore(middleware)(mockedStore);
        const { container } = renderWithProvider(
          <ConfirmTransactionBase actionKey="confirm" />,
          store,
        );

        const recipientElem = container.querySelector(sendToRecipientSelector);
        expect(recipientElem).toHaveTextContent(mockTxParamsToAddressConcat);
      });
    });
  });
});
