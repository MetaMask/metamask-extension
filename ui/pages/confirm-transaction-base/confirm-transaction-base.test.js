import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { fireEvent } from '@testing-library/react';

import { NetworkType } from '@metamask/controller-utils';
import { NetworkStatus } from '@metamask/network-controller';
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { act } from 'react-dom/test-utils';
import { renderWithProvider } from '../../../test/lib/render-helpers';
import { setBackgroundConnection } from '../../store/background-connection';
import { INITIAL_SEND_STATE_FOR_EXISTING_DRAFT } from '../../../test/jest/mocks';
import { GasEstimateTypes } from '../../../shared/constants/gas';
import { KeyringType } from '../../../shared/constants/keyring';
import {
  CHAIN_IDS,
  GOERLI_DISPLAY_NAME,
  NETWORK_TYPES,
} from '../../../shared/constants/network';
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

const mockTxParamsFromAddress = '0x123456789';

const mockTxParamsToAddress = '0x85c1685cfceaa5c0bdb1609fc536e9a8387dd65e';
const mockTxParamsToAddressConcat = '0x85c16...DD65e';

const mockParsedTxDataToAddressWithout0x =
  'e57e7847fd3661a9b7c86aaf1daea08d9da5750a';
const mockParsedTxDataToAddress = '0xe57E7...5750A';

const mockPropsToAddress = '0x33m1685cfceaa5c0bdb1609fc536e9a8387dd567';
const mockPropsToAddressConcat = '0x33m16...dd567';

const mockTxParams = {
  from: mockTxParamsFromAddress,
  to: mockTxParamsToAddress,
  value: '0x5af3107a4000',
  gas: '0x5208',
  maxFeePerGas: '0x59682f16',
  maxPriorityFeePerGas: '0x59682f00',
  type: '0x2',
  data: `0xa22cb465000000000000000000000000${mockParsedTxDataToAddressWithout0x}0000000000000000000000000000000000000000000000000000000000000001`,
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
    transactions: [
      {
        id: 1,
        chainId: '0x5',
        txParams: { ...mockTxParams },
        status: 'unapproved',
      },
    ],
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
    selectedNetworkClientId: NetworkType.mainnet,
    networksMetadata: {
      [NetworkType.mainnet]: {
        EIPS: {},
        status: NetworkStatus.Available,
      },
    },
    tokens: [],
    preferences: {
      useNativeCurrencyAsPrimaryCurrency: false,
    },
    currentCurrency: 'USD',
    currencyRates: {},
    providerConfig: {
      chainId: CHAIN_IDS.GOERLI,
      nickname: GOERLI_DISPLAY_NAME,
      type: NETWORK_TYPES.GOERLI,
    },
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
  mockedStore.metamask.transactions[0].txParams = { ..._mockTxParams };
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
    mockedStore.metamask.providerConfig.chainId = CHAIN_IDS.OPTIMISM;
    mockedStore.confirmTransaction.txData.chainId = CHAIN_IDS.OPTIMISM;
    const store = configureMockStore(middleware)(mockedStore);
    const { queryByText } = renderWithProvider(
      <ConfirmTransactionBase actionKey="confirm" />,
      store,
    );
    expect(queryByText('Layer 1 fees')).toBeInTheDocument();
    expect(queryByText('Layer 2 gas fee')).toBeInTheDocument();
  });

  it('should render NoteToTrader when isNoteToTraderSupported is true', () => {
    mockedStore.metamask.custodyAccountDetails = {
      [mockTxParamsFromAddress]: {
        address: mockTxParamsFromAddress,
        details: 'details',
        custodyType: 'testCustody - Saturn',
        custodianName: 'saturn-dev',
      },
    };

    mockedStore.metamask.mmiConfiguration = {
      custodians: [
        {
          envName: 'saturn-dev',
          displayName: 'Saturn Custody',
          isNoteToTraderSupported: true,
        },
      ],
    };

    const store = configureMockStore(middleware)(mockedStore);
    const { getByTestId } = renderWithProvider(
      <ConfirmTransactionBase actionKey="confirm" />,
      store,
    );

    expect(getByTestId('note-tab')).toBeInTheDocument();
  });

  it('handleMMISubmit calls sendTransaction correctly when isNoteToTraderSupported is false', async () => {
    const newMockedStore = {
      ...mockedStore,
      appState: {
        ...mockedStore.appState,
        gasLoadingAnimationIsShowing: false,
      },
      confirmTransaction: {
        ...mockedStore.confirmTransaction,
        txData: {
          ...mockedStore.confirmTransaction.txData,
          custodyStatus: true,
        },
      },
      metamask: {
        ...mockedStore.metamask,
        accounts: {
          [mockTxParamsFromAddress]: {
            balance: '0x1000000000000000000',
            address: mockTxParamsFromAddress,
          },
        },
        gasEstimateType: GasEstimateTypes.feeMarket,
        selectedNetworkClientId: NetworkType.mainnet,
        networksMetadata: {
          ...mockedStore.metamask.networksMetadata,
          [NetworkType.mainnet]: {
            EIPS: {
              1559: true,
            },
            status: NetworkStatus.Available,
          },
        },
        customGas: {
          gasLimit: '0x5208',
          gasPrice: '0x59682f00',
        },
        noGasPrice: false,
        keyrings: [
          {
            type: 'Custody',
            accounts: ['0x123456789'],
          },
        ],
        custodyAccountDetails: {
          [mockTxParamsFromAddress]: {
            address: mockTxParamsFromAddress,
            details: 'details',
            custodyType: 'testCustody - Saturn',
            custodianName: 'saturn-dev',
          },
        },
        mmiConfiguration: {
          custodians: [
            {
              envName: 'saturn-dev',
              displayName: 'Saturn Custody',
              isNoteToTraderSupported: false,
            },
          ],
        },
      },
      send: {
        ...mockedStore.send,
        gas: {
          ...mockedStore.send.gas,
          gasEstimateType: GasEstimateTypes.legacy,
          gasFeeEstimates: {
            low: '0',
            medium: '1',
            high: '2',
          },
        },
        hasSimulationError: false,
        userAcknowledgedGasMissing: false,
        submitting: false,
        hardwareWalletRequiresConnection: false,
        gasIsLoading: false,
        gasFeeIsCustom: true,
      },
    };

    const store = configureMockStore(middleware)(newMockedStore);
    const sendTransaction = jest
      .fn()
      .mockResolvedValue(newMockedStore.confirmTransaction.txData);
    const updateTransaction = jest.fn().mockResolvedValue();
    const showCustodianDeepLink = jest.fn();
    const setWaitForConfirmDeepLinkDialog = jest.fn();

    const { getByTestId } = renderWithProvider(
      <ConfirmTransactionBase
        actionKey="confirm"
        sendTransaction={sendTransaction}
        updateTransaction={updateTransaction}
        showCustodianDeepLink={showCustodianDeepLink}
        setWaitForConfirmDeepLinkDialog={setWaitForConfirmDeepLinkDialog}
        toAddress={mockPropsToAddress}
        toAccounts={[{ address: mockPropsToAddress }]}
        isMainBetaFlask={false}
      />,
      store,
    );

    const confirmButton = getByTestId('page-container-footer-next');

    await act(async () => {
      fireEvent.click(confirmButton);
    });

    expect(sendTransaction).toHaveBeenCalled();
  });

  it('handleMainSubmit calls sendTransaction correctly', async () => {
    const newMockedStore = {
      ...mockedStore,
      appState: {
        ...mockedStore.appState,
        gasLoadingAnimationIsShowing: false,
      },
      metamask: {
        ...mockedStore.metamask,
        accounts: {
          [mockTxParamsFromAddress]: {
            balance: '0x1000000000000000000',
            address: mockTxParamsFromAddress,
          },
        },
        gasEstimateType: GasEstimateTypes.feeMarket,
        selectedNetworkClientId: NetworkType.mainnet,
        networksMetadata: {
          ...mockedStore.metamask.networksMetadata,
          [NetworkType.mainnet]: {
            EIPS: { 1559: true },
            status: NetworkStatus.Available,
          },
        },
        customGas: {
          gasLimit: '0x5208',
          gasPrice: '0x59682f00',
        },
        noGasPrice: false,
      },
      send: {
        ...mockedStore.send,
        gas: {
          ...mockedStore.send.gas,
          gasEstimateType: GasEstimateTypes.legacy,
          gasFeeEstimates: {
            low: '0',
            medium: '1',
            high: '2',
          },
        },
        hasSimulationError: false,
        userAcknowledgedGasMissing: false,
        submitting: false,
        hardwareWalletRequiresConnection: false,
        gasIsLoading: false,
        gasFeeIsCustom: true,
      },
    };
    const store = configureMockStore(middleware)(newMockedStore);
    const sendTransaction = jest.fn().mockResolvedValue();

    const { getByTestId } = renderWithProvider(
      <ConfirmTransactionBase
        actionKey="confirm"
        sendTransaction={sendTransaction}
        toAddress={mockPropsToAddress}
        toAccounts={[{ address: mockPropsToAddress }]}
      />,
      store,
    );
    const confirmButton = getByTestId('page-container-footer-next');
    fireEvent.click(confirmButton);
    expect(sendTransaction).toHaveBeenCalled();
  });

  it('handleMMISubmit calls sendTransaction correctly and then showCustodianDeepLink', async () => {
    const newMockedStore = {
      ...mockedStore,
      appState: {
        ...mockedStore.appState,
        gasLoadingAnimationIsShowing: false,
      },
      confirmTransaction: {
        ...mockedStore.confirmTransaction,
        txData: {
          ...mockedStore.confirmTransaction.txData,
          custodyStatus: true,
        },
      },
      metamask: {
        ...mockedStore.metamask,
        accounts: {
          [mockTxParamsFromAddress]: {
            balance: '0x1000000000000000000',
            address: mockTxParamsFromAddress,
          },
        },
        gasEstimateType: GasEstimateTypes.feeMarket,
        selectedNetworkClientId: NetworkType.mainnet,
        networksMetadata: {
          ...mockedStore.metamask.networksMetadata,
          [NetworkType.mainnet]: {
            EIPS: {
              1559: true,
            },
            status: NetworkStatus.Available,
          },
        },
        customGas: {
          gasLimit: '0x5208',
          gasPrice: '0x59682f00',
        },
        noGasPrice: false,
      },
      send: {
        ...mockedStore.send,
        gas: {
          ...mockedStore.send.gas,
          gasEstimateType: GasEstimateTypes.legacy,
          gasFeeEstimates: {
            low: '0',
            medium: '1',
            high: '2',
          },
        },
        hasSimulationError: false,
        userAcknowledgedGasMissing: false,
        submitting: false,
        hardwareWalletRequiresConnection: false,
        gasIsLoading: false,
        gasFeeIsCustom: true,
      },
    };
    const store = configureMockStore(middleware)(newMockedStore);
    const sendTransaction = jest
      .fn()
      .mockResolvedValue(newMockedStore.confirmTransaction.txData);
    const showCustodianDeepLink = jest.fn();
    const setWaitForConfirmDeepLinkDialog = jest.fn();

    const { getByTestId } = renderWithProvider(
      <ConfirmTransactionBase
        actionKey="confirm"
        sendTransaction={sendTransaction}
        showCustodianDeepLink={showCustodianDeepLink}
        setWaitForConfirmDeepLinkDialog={setWaitForConfirmDeepLinkDialog}
        toAddress={mockPropsToAddress}
        toAccounts={[{ address: mockPropsToAddress }]}
        isMainBetaFlask={false}
      />,
      store,
    );
    const confirmButton = getByTestId('page-container-footer-next');
    fireEvent.click(confirmButton);
    expect(setWaitForConfirmDeepLinkDialog).toHaveBeenCalled();
    await expect(sendTransaction).toHaveBeenCalled();
    expect(showCustodianDeepLink).toHaveBeenCalled();
  });

  describe('when rendering the recipient value', () => {
    describe(`when the transaction is a ${TransactionType.simpleSend} type`, () => {
      it(`should use txParams.to address`, () => {
        const store = configureMockStore(middleware)(mockedStore);
        const { container } = renderWithProvider(
          <ConfirmTransactionBase actionKey="confirm" />,
          store,
        );

        const recipientElem = container.querySelector(sendToRecipientSelector);
        expect(recipientElem).toHaveTextContent(mockTxParamsToAddressConcat);
      });

      it(`should use txParams.to address even if there is no amount sent`, () => {
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
    describe(`when the transaction is NOT a ${TransactionType.simpleSend} type`, () => {
      beforeEach(() => {
        mockedStore.confirmTransaction.txData.type =
          TransactionType.contractInteraction;
      });

      describe('when there is an amount being sent (it should be treated as a general contract intereaction rather than custom one)', () => {
        it('should use txParams.to address (contract address)', () => {
          mockedStoreWithConfirmTxParams({
            ...mockTxParams,
            value: '0x45666',
          });
          const store = configureMockStore(middleware)(mockedStore);
          const { container } = renderWithProvider(
            <ConfirmTransactionBase actionKey="confirm" />,
            store,
          );

          const recipientElem = container.querySelector(
            sendToRecipientSelector,
          );
          expect(recipientElem).toHaveTextContent(mockTxParamsToAddressConcat);
        });
      });

      describe(`when there is no amount being sent`, () => {
        it('should use propToAddress (toAddress passed as prop)', () => {
          mockedStoreWithConfirmTxParams({
            ...mockTxParams,
            value: '0x0',
          });
          const store = configureMockStore(middleware)(mockedStore);

          const { container } = renderWithProvider(
            <ConfirmTransactionBase
              // we want to test toAddress provided by ownProps in mapStateToProps, but this
              // currently overrides toAddress this should pan out fine when we refactor the
              // component into a functional component and remove the container.js file
              toAddress={mockPropsToAddress}
              actionKey="confirm"
            />,
            store,
          );

          const recipientElem = container.querySelector(
            sendToRecipientSelector,
          );
          expect(recipientElem).toHaveTextContent(mockPropsToAddressConcat);
        });

        it('should use address parsed from transaction data if propToAddress is not provided', () => {
          mockedStoreWithConfirmTxParams({
            ...mockTxParams,
            value: '0x0',
          });
          const store = configureMockStore(middleware)(mockedStore);
          const { container } = renderWithProvider(
            <ConfirmTransactionBase actionKey="confirm" />,
            store,
          );

          const recipientElem = container.querySelector(
            sendToRecipientSelector,
          );
          expect(recipientElem).toHaveTextContent(mockParsedTxDataToAddress);
        });

        it('should use txParams.to if neither propToAddress is not provided nor the transaction data to address were provided', () => {
          mockedStoreWithConfirmTxParams({
            ...mockTxParams,
            data: '0x',
            value: '0x0',
          });
          const store = configureMockStore(middleware)(mockedStore);
          const { container } = renderWithProvider(
            <ConfirmTransactionBase actionKey="confirm" />,
            store,
          );

          const recipientElem = container.querySelector(
            sendToRecipientSelector,
          );
          expect(recipientElem).toHaveTextContent(mockTxParamsToAddressConcat);
        });
      });
    });
  });
});
